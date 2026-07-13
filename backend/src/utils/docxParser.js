const mammoth = require('mammoth');

const parseDocxQuestions = async (filePath) => {
  let html = '';
  try {
    const result = await mammoth.convertToHtml({ path: filePath });
    html = result.value;
    console.log('HTML extracted, length:', html.length);
  } catch (err) {
    throw new Error('Cannot read Word file: ' + err.message);
  }

  if (!html || html.trim().length < 20) {
    throw new Error('Word document is empty or unreadable');
  }

  const questions = [];
  const cells = html.split(/<\/?td[^>]*>/).filter(Boolean);

  for (const cell of cells) {
    try {
      const q = parseCellToQuestion(cell);
      if (q) questions.push(q);
    } catch (e) {}
  }

  if (questions.length === 0) {
    console.log('Table parsing found 0, trying fallback...');
    const fallback = parseParagraphBased(html);
    questions.push(...fallback);
  }

  console.log('Total questions parsed:', questions.length);
  return questions;
};

const stripHtml = (html) => {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
};

const parseCellToQuestion = (cellHtml) => {
  const plainText = stripHtml(cellHtml);
  const questionNumMatch = plainText.match(/^\s*(\d+)\.\s+(.+)/s);
  if (!questionNumMatch) return null;

  // Find bold text = correct answer
  const boldMatches = [...cellHtml.matchAll(/<strong[^>]*>(.*?)<\/strong>/gis)];
  if (boldMatches.length === 0) return null;

  const boldText = stripHtml(boldMatches[0][1]).trim();
  const correctLetterMatch = boldText.match(/^\s*[\[(]?\s*([a-dA-D])\s*[)\]]/);
  if (!correctLetterMatch) return null;
  const correctLetter = correctLetterMatch[1].toUpperCase();

  // Extract question text (stop before first option)
  const lines = plainText.split('\n').map(l => l.trim()).filter(Boolean);
  let questionLines = [];
  for (const line of lines) {
    if (/^\s*[\[(]?[a-dA-D][\].)]\s/.test(line)) break;
    if (/^\s*[a-dA-D]\s*$/.test(line)) break;
    questionLines.push(line);
  }
  let questionText = questionLines.join(' ').trim().replace(/^\d+[.)]\s*/, '').trim();
  if (!questionText || questionText.length < 3) return null;

  // Build option map
  const optionMap = { A: '', B: '', C: '', D: '' };

  // From pattern matches: a) text, (a) text
  const optionPattern = /[\[(]?([a-dA-D])[\].)]\s+([^\n[\](]{2,80})/g;
  const patternMatches = [...plainText.matchAll(optionPattern)];
  for (const m of patternMatches) {
    const letter = m[1].toUpperCase();
    const text = m[2].trim().replace(/\s+/g, ' ');
    if (text && !optionMap[letter]) optionMap[letter] = text;
  }

  // From <li> items for unlabeled options
  const liMatches = [...cellHtml.matchAll(/<li[^>]*>(.*?)<\/li>/gis)];
  const liTexts = liMatches.map(m => stripHtml(m[1]).trim()).filter(t => t.length > 0);
  const emptyLetters = ['A','B','C','D'].filter(l => !optionMap[l]);
  liTexts.forEach((text, i) => {
    if (i < emptyLetters.length && text) optionMap[emptyLetters[i]] = text;
  });

  // Set correct answer text from bold
  const boldOptionText = boldText.replace(/^\s*[\[(]?\s*[a-dA-D]\s*[)\]]\s*/, '').trim();
  if (boldOptionText) optionMap[correctLetter] = boldOptionText;

  // Standard Rwanda exam fallback options
  const plain = plainText.toLowerCase();
  if (!optionMap['D'] && plain.includes('nta gisubizo')) optionMap['D'] = "Nta gisubizo cy'ukuri kirimo";
  if (!optionMap['C'] && plain.includes('a na b ni ibisubizo')) optionMap['C'] = "A na B ni ibisubizo by'ukuri";

  // Build final array
  const options = [];
  for (const letter of ['A','B','C','D']) {
    if (optionMap[letter]) {
      options.push({ letter, en: optionMap[letter], rw: optionMap[letter], fr: optionMap[letter] });
    }
  }

  // Pad to 4
  const allLetters = ['A','B','C','D'];
  while (options.length < 4) {
    const nextLetter = allLetters[options.length];
    options.push({ letter: nextLetter, en: "Nta gisubizo cy'ukuri kirimo", rw: "Nta gisubizo cy'ukuri kirimo", fr: "Pas de bonne réponse" });
  }

  return {
    question_en: questionText,
    question_rw: questionText,
    question_fr: questionText,
    options: options.slice(0, 4),
    correct_answer: correctLetter,
    category: '',
    difficulty: 'medium',
  };
};

const parseParagraphBased = (html) => {
  const questions = [];
  const paragraphs = html.split(/<\/?p[^>]*>/).map(p => stripHtml(p).trim()).filter(Boolean);
  let current = null;
  const letterMap = { a:'A', b:'B', c:'C', d:'D' };
  const saveQ = () => {
    if (current && current.question_en && current.options.length >= 2 && current.correct_answer) {
      while (current.options.length < 4) {
        current.options.push({ letter: ['A','B','C','D'][current.options.length], en: "Nta gisubizo cy'ukuri kirimo", rw: "Nta gisubizo cy'ukuri kirimo", fr: "Pas de bonne réponse" });
      }
      questions.push({ ...current });
    }
  };
  for (const para of paragraphs) {
    const numMatch = para.match(/^(\d+)\.\s+(.+)/);
    const optMatch = para.match(/^[\[(]?([a-dA-D])[\].)]\s+(.+)/);
    if (numMatch) { saveQ(); current = { question_en: numMatch[2].trim(), question_rw: numMatch[2].trim(), question_fr: numMatch[2].trim(), options: [], correct_answer: 'A', category: '', difficulty: 'medium' }; }
    else if (optMatch && current) { const letter = letterMap[optMatch[1].toLowerCase()] || optMatch[1].toUpperCase(); current.options.push({ letter, en: optMatch[2].trim(), rw: optMatch[2].trim(), fr: optMatch[2].trim() }); }
  }
  saveQ();
  return questions;
};

module.exports = { parseDocxQuestions };

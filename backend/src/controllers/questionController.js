const { pool } = require('../config/database');
const { parseDocxQuestions } = require('../utils/docxParser');
const fs = require('fs');

// GET /api/questions
exports.getQuestions = async (req, res) => {
  try {
    const { lang = 'en', category_id, page = 1, limit = 20 } = req.query;
    const l = ['en', 'rw', 'fr'].includes(lang) ? lang : 'en';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = 'WHERE q.is_active = 1';
    const params = [];
    if (category_id) {
      whereClause += ' AND q.category_id = ?';
      params.push(category_id);
    }

    const [questions] = await pool.execute(
      `SELECT q.id, q.question_${l} as question, q.image_url, q.difficulty, c.name_${l} as category,
              COUNT(ao.id) as options_count
       FROM questions q
       LEFT JOIN categories c ON q.category_id = c.id
       LEFT JOIN answer_options ao ON ao.question_id = q.id
       ${whereClause}
       GROUP BY q.id
       ORDER BY q.id
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM questions q ${whereClause}`,
      params
    );

    res.json({ success: true, questions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
};

// GET /api/questions/:id
exports.getQuestion = async (req, res) => {
  try {
    const { lang = 'en' } = req.query;
    const l = ['en', 'rw', 'fr'].includes(lang) ? lang : 'en';

    const [rows] = await pool.execute(
      `SELECT q.id, q.question_${l} as question, q.image_url, q.difficulty,
              ao.option_letter, ao.option_${l} as option_text, ao.is_correct
       FROM questions q
       JOIN answer_options ao ON ao.question_id = q.id
       WHERE q.id = ? AND q.is_active = 1
       ORDER BY ao.option_letter`,
      [req.params.id]
    );

    if (!rows.length) return res.status(404).json({ success: false, message: 'Question not found' });

    const q = {
      id: rows[0].id,
      question: rows[0].question,
      image_url: rows[0].image_url,
      difficulty: rows[0].difficulty,
      options: rows.map((r) => ({ letter: r.option_letter, text: r.option_text, is_correct: r.is_correct })),
    };

    res.json({ success: true, question: q });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch question' });
  }
};

// POST /api/admin/questions
exports.createQuestion = async (req, res) => {
  try {
    const { question_en, question_rw, question_fr, category_id, difficulty, options } = req.body;

    if (!question_en || !question_rw || !question_fr) {
      return res.status(400).json({ success: false, message: 'Question text in all 3 languages required' });
    }
    if (!options || options.length !== 4) {
      return res.status(400).json({ success: false, message: '4 options required' });
    }
    if (!options.some((o) => o.is_correct)) {
      return res.status(400).json({ success: false, message: 'At least one correct answer required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO questions (question_en, question_rw, question_fr, category_id, difficulty, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [question_en, question_rw, question_fr, category_id || null, difficulty || 'medium', req.user.id]
    );

    const qId = result.insertId;
    for (const opt of options) {
      await pool.execute(
        'INSERT INTO answer_options (question_id, option_letter, option_en, option_rw, option_fr, is_correct) VALUES (?, ?, ?, ?, ?, ?)',
        [qId, opt.letter, opt.en, opt.rw || opt.en, opt.fr || opt.en, opt.is_correct ? 1 : 0]
      );
    }

    res.status(201).json({ success: true, questionId: qId, message: 'Question created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create question' });
  }
};

// PUT /api/admin/questions/:id
exports.updateQuestion = async (req, res) => {
  try {
    const { question_en, question_rw, question_fr, category_id, difficulty, is_active, options } = req.body;
    const { id } = req.params;

    await pool.execute(
      'UPDATE questions SET question_en = COALESCE(?, question_en), question_rw = COALESCE(?, question_rw), question_fr = COALESCE(?, question_fr), category_id = COALESCE(?, category_id), difficulty = COALESCE(?, difficulty), is_active = COALESCE(?, is_active) WHERE id = ?',
      [question_en, question_rw, question_fr, category_id, difficulty, is_active, id]
    );

    if (options && options.length === 4) {
      await pool.execute('DELETE FROM answer_options WHERE question_id = ?', [id]);
      for (const opt of options) {
        await pool.execute(
          'INSERT INTO answer_options (question_id, option_letter, option_en, option_rw, option_fr, is_correct) VALUES (?, ?, ?, ?, ?, ?)',
          [id, opt.letter, opt.en, opt.rw || opt.en, opt.fr || opt.en, opt.is_correct ? 1 : 0]
        );
      }
    }

    res.json({ success: true, message: 'Question updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update question' });
  }
};

// DELETE /api/admin/questions/:id
exports.deleteQuestion = async (req, res) => {
  try {
    await pool.execute('UPDATE questions SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Question deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete question' });
  }
};

// POST /api/admin/questions/import-docx
exports.importFromDocx = async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Make sure to select a .docx file.' });
    }

    console.log('📂 Importing file:', filePath);

    // Parse the Word document
    let parsedQuestions = [];
    try {
      parsedQuestions = await parseDocxQuestions(filePath);
    } catch (parseErr) {
      console.error('Parse error:', parseErr);
      return res.status(400).json({
        success: false,
        message: 'Failed to read Word document: ' + parseErr.message,
      });
    }

    console.log(`📋 Parsed ${parsedQuestions.length} raw questions from document`);

    if (!parsedQuestions.length) {
      return res.status(400).json({
        success: false,
        message:
          'No valid questions found in the document. Please check the format guide and make sure your document follows the correct template.',
        hint: 'Each question needs: Q: (question), A: B: C: D: (options), ANS: (correct letter)',
      });
    }

    // Get categories for matching
    const [categories] = await pool.execute('SELECT id, name_en FROM categories');
    const catMap = {};
    categories.forEach((c) => {
      catMap[c.name_en.toLowerCase()] = c.id;
    });

    let imported = 0;
    let skipped = 0;
    const skipReasons = [];

    for (const q of parsedQuestions) {
      try {
        // Validate
        if (!q.question_en || q.question_en.trim().length < 3) {
          skipped++;
          skipReasons.push('Empty question text');
          continue;
        }
        if (!q.options || q.options.length < 4) {
          skipped++;
          skipReasons.push(`Question "${q.question_en.substring(0, 30)}..." has only ${q.options?.length || 0} options`);
          continue;
        }
        if (!q.correct_answer || !['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
          skipped++;
          skipReasons.push(`Question "${q.question_en.substring(0, 30)}..." has invalid/missing answer: "${q.correct_answer}"`);
          continue;
        }

        // Match category
        const categoryId = q.category
          ? catMap[q.category.toLowerCase()] || null
          : null;

        // Insert question
        const [result] = await pool.execute(
          'INSERT INTO questions (question_en, question_rw, question_fr, category_id, difficulty, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          [
            q.question_en.trim(),
            (q.question_rw || q.question_en).trim(),
            (q.question_fr || q.question_en).trim(),
            categoryId,
            ['easy', 'medium', 'hard'].includes(q.difficulty) ? q.difficulty : 'medium',
            req.user.id,
          ]
        );

        const qId = result.insertId;

        // Insert options
        for (const opt of q.options.slice(0, 4)) {
          await pool.execute(
            'INSERT INTO answer_options (question_id, option_letter, option_en, option_rw, option_fr, is_correct) VALUES (?, ?, ?, ?, ?, ?)',
            [
              qId,
              opt.letter,
              (opt.en || 'N/A').trim(),
              (opt.rw || opt.en || 'N/A').trim(),
              (opt.fr || opt.en || 'N/A').trim(),
              opt.letter === q.correct_answer ? 1 : 0,
            ]
          );
        }

        imported++;
      } catch (insertErr) {
        skipped++;
        skipReasons.push('DB error: ' + insertErr.message);
        console.error('Insert error for question:', q.question_en, insertErr.message);
      }
    }

    // Log skip reasons for debugging
    if (skipReasons.length > 0) {
      console.log('⚠️ Skipped reasons:', skipReasons.slice(0, 5));
    }

    const response = {
      success: true,
      message: `Import complete: ${imported} questions added${skipped > 0 ? `, ${skipped} skipped` : ''}`,
      imported,
      skipped,
    };

    if (skipped > 0 && skipReasons.length > 0) {
      response.skipDetails = skipReasons.slice(0, 5); // Show first 5 reasons
    }

    res.json(response);
  } catch (err) {
    console.error('Import failed:', err);
    res.status(500).json({
      success: false,
      message: 'Import failed: ' + err.message,
    });
  } finally {
    // Always clean up uploaded file
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

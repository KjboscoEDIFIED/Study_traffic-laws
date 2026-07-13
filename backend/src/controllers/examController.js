const { pool } = require('../config/database');

// POST /api/exams/create — Create exam after successful payment
exports.createExam = async (req, res) => {
  try {
    const { payment_id, language = 'en' } = req.body;
    const userId = req.user.id;

    // Verify payment is successful
    const [payments] = await pool.execute(
      'SELECT * FROM payments WHERE id = ? AND user_id = ? AND status = "successful"',
      [payment_id, userId]
    );
    if (!payments.length) {
      return res.status(402).json({ success: false, message: 'Valid successful payment required' });
    }
    // TEST MODE — skip payment check temporarily
    // TODO: Remove this when MoMo is configured
    /*const [payments] = await pool.execute(
      'SELECT * FROM payments WHERE id = ? AND user_id = ?',
      [payment_id, userId]
    );
    if (!payments.length) {
      return res.status(402).json({ success: false, message: 'Payment not found' });
    }
    // Temporarily mark any payment as successful for testing
    await pool.execute(
      'UPDATE payments SET status = "successful" WHERE id = ?',
      [payment_id]
    );*/

    // Check payment not already used
    const [usedExam] = await pool.execute(
      'SELECT id FROM exams WHERE payment_id = ? AND status != "abandoned"',
      [payment_id]
    );
    if (usedExam.length) {
      return res.status(409).json({ success: false, message: 'Payment already used for an exam' });
    }

    // Get question count from settings
    const [settings] = await pool.execute(
      "SELECT setting_value FROM system_settings WHERE setting_key IN ('exam_questions_count', 'pass_mark')"
    );
    const settingsMap = Object.fromEntries(settings.map((s) => [s.setting_key, s.setting_value]));
    const qCount = parseInt(settingsMap.exam_questions_count) || 20;
    const passMark = parseFloat(settingsMap.pass_mark) || 70;

    // Pick random questions
    const [questions] = await pool.execute(
      'SELECT id FROM questions WHERE is_active = 1 ORDER BY RAND() LIMIT ?',
      [qCount]
    );

    if (questions.length < qCount) {
      return res.status(503).json({
        success: false,
        message: `Not enough questions in the system (need ${qCount}, have ${questions.length})`,
      });
    }

    // Create exam
    const [examResult] = await pool.execute(
      'INSERT INTO exams (user_id, payment_id, language, total_questions, pass_mark, status) VALUES (?, ?, ?, ?, ?, "in_progress")',
      [userId, payment_id, language, qCount, passMark]
    );
    const examId = examResult.insertId;

    await pool.execute(
      'UPDATE exams SET started_at = NOW() WHERE id = ?',
      [examId]
    );

    // Insert exam questions
    const questionRows = questions.map((q, idx) => [examId, q.id, idx + 1]);
    await pool.query(
      'INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ?',
      [questionRows]
    );

    res.status(201).json({ success: true, examId, message: 'Exam created. Good luck!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create exam' });
  }
};

// GET /api/exams/:examId/questions — Load all questions for an exam
exports.getExamQuestions = async (req, res) => {
  try {
    const { examId } = req.params;
    const { lang = 'en' } = req.query;
    const userId = req.user.id;

    const [exams] = await pool.execute(
      'SELECT * FROM exams WHERE id = ? AND user_id = ?',
      [examId, userId]
    );
    if (!exams.length) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const exam = exams[0];
    if (exam.status === 'completed') {
      return res.status(400).json({ success: false, message: 'Exam already completed' });
    }

    const l = ['en', 'rw', 'fr'].includes(lang) ? lang : 'en';

    const [rows] = await pool.execute(
      `SELECT 
        eq.id as exam_question_id,
        eq.question_order,
        eq.selected_option,
        eq.is_correct,
        q.id as question_id,
        q.question_${l} as question_text,
        q.image_url,
        ao.option_letter,
        ao.option_${l} as option_text
      FROM exam_questions eq
      JOIN questions q ON eq.question_id = q.id
      JOIN answer_options ao ON ao.question_id = q.id
      WHERE eq.exam_id = ?
      ORDER BY eq.question_order, ao.option_letter`,
      [examId]
    );

    // Group by question
    const questionsMap = {};
    for (const row of rows) {
      if (!questionsMap[row.question_order]) {
        questionsMap[row.question_order] = {
          exam_question_id: row.exam_question_id,
          question_id: row.question_id,
          question_order: row.question_order,
          question_text: row.question_text,
          image_url: row.image_url,
          selected_option: row.selected_option,
          options: [],
        };
      }
      questionsMap[row.question_order].options.push({
        letter: row.option_letter,
        text: row.option_text,
      });
    }

    const questions = Object.values(questionsMap).sort((a, b) => a.question_order - b.question_order);

    res.json({
      success: true,
      exam: {
        id: exam.id,
        status: exam.status,
        total_questions: exam.total_questions,
        language: exam.language,
        started_at: exam.started_at,
      },
      questions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to load questions' });
  }
};

// POST /api/exams/:examId/answer — Submit a single answer
exports.submitAnswer = async (req, res) => {
  try {
    const { examId } = req.params;
    const { exam_question_id, selected_option, time_spent_seconds = 0 } = req.body;
    const userId = req.user.id;

    const [exams] = await pool.execute(
      'SELECT id, status FROM exams WHERE id = ? AND user_id = ?',
      [examId, userId]
    );
    if (!exams.length || exams[0].status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Exam not active' });
    }

    // Get the correct answer
    const [eqRows] = await pool.execute(
      `SELECT eq.*, ao.is_correct
       FROM exam_questions eq
       JOIN answer_options ao ON ao.question_id = eq.question_id AND ao.option_letter = ?
       WHERE eq.id = ? AND eq.exam_id = ?`,
      [selected_option, exam_question_id, examId]
    );

    if (!eqRows.length) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    const isCorrect = eqRows[0].is_correct === 1;

    await pool.execute(
      'UPDATE exam_questions SET selected_option = ?, is_correct = ?, time_spent_seconds = ?, answered_at = NOW() WHERE id = ?',
      [selected_option, isCorrect, time_spent_seconds, exam_question_id]
    );

    res.json({ success: true, is_correct: isCorrect });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to submit answer' });
  }
};

// POST /api/exams/:examId/finish — Finish and grade the exam
exports.finishExam = async (req, res) => {
  try {
    const { examId } = req.params;
    const userId = req.user.id;

    const [exams] = await pool.execute(
      'SELECT * FROM exams WHERE id = ? AND user_id = ?',
      [examId, userId]
    );
    if (!exams.length) {
      return res.status(404).json({ success: false, message: 'Exam not found' });
    }

    const exam = exams[0];
    if (exam.status === 'completed') {
      // Return existing results
      return getResultResponse(res, examId, exam);
    }

    // Count correct answers
    const [countRows] = await pool.execute(
      'SELECT COUNT(*) as correct FROM exam_questions WHERE exam_id = ? AND is_correct = 1',
      [examId]
    );
    const correct = countRows[0].correct;
    const score = (correct / exam.total_questions) * 100;
    const passed = score >= exam.pass_mark;

    await pool.execute(
      'UPDATE exams SET status = "completed", correct_answers = ?, score = ?, passed = ?, completed_at = NOW() WHERE id = ?',
      [correct, score.toFixed(2), passed, examId]
    );

    const [updated] = await pool.execute('SELECT * FROM exams WHERE id = ?', [examId]);
    return getResultResponse(res, examId, updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to finish exam' });
  }
};

const getResultResponse = async (res, examId, exam) => {
  const [details] = await pool.execute(
    `SELECT 
      eq.question_order,
      eq.selected_option,
      eq.is_correct,
      q.question_en,
      q.question_rw,
      q.question_fr,
      ao_correct.option_letter as correct_option,
      ao_correct.option_en as correct_en,
      ao_correct.option_rw as correct_rw,
      ao_correct.option_fr as correct_fr
    FROM exam_questions eq
    JOIN questions q ON eq.question_id = q.id
    JOIN answer_options ao_correct ON ao_correct.question_id = q.id AND ao_correct.is_correct = 1
    WHERE eq.exam_id = ?
    ORDER BY eq.question_order`,
    [examId]
  );

  res.json({
    success: true,
    result: {
      exam_id: exam.id,
      score: parseFloat(exam.score),
      correct_answers: exam.correct_answers,
      total_questions: exam.total_questions,
      pass_mark: parseFloat(exam.pass_mark),
      passed: exam.passed === 1,
      started_at: exam.started_at,
      completed_at: exam.completed_at,
      details,
    },
  });
};

// GET /api/exams/my-exams
exports.myExams = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, language, total_questions, correct_answers, score, pass_mark, passed, status, started_at, completed_at FROM exams WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ success: true, exams: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
};

const { pool } = require('../config/database');

// GET /api/admin/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const [[userStats]] = await pool.execute(
      'SELECT COUNT(*) as total, SUM(role = "student") as students, SUM(role = "admin") as admins FROM users WHERE is_active = 1'
    );
    const [[questionStats]] = await pool.execute(
      'SELECT COUNT(*) as total FROM questions WHERE is_active = 1'
    );
    const [[examStats]] = await pool.execute(
      'SELECT COUNT(*) as total, SUM(status = "completed") as completed, SUM(passed = 1) as passed FROM exams'
    );
    const [[revenueStats]] = await pool.execute(
      'SELECT SUM(amount) as total_revenue, COUNT(*) as total_payments FROM payments WHERE status = "successful"'
    );
    const [recentExams] = await pool.execute(
      `SELECT e.id, e.score, e.passed, e.status, e.completed_at, u.full_name, u.phone
       FROM exams e JOIN users u ON e.user_id = u.id
       ORDER BY e.created_at DESC LIMIT 10`
    );
    const [dailyStats] = await pool.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as exams, SUM(passed) as passed
       FROM exams WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at) ORDER BY date`
    );

    res.json({
      success: true,
      stats: {
        users: userStats,
        questions: questionStats,
        exams: examStats,
        revenue: revenueStats,
      },
      recentExams,
      dailyStats,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const like = `%${search}%`;

    const [users] = await pool.execute(
      `SELECT u.id, u.full_name, u.phone, u.email, u.role, u.preferred_language, u.is_active, u.created_at,
              COUNT(DISTINCT e.id) as total_exams, SUM(e.passed) as passed_exams
       FROM users u
       LEFT JOIN exams e ON e.user_id = u.id
       WHERE (u.full_name LIKE ? OR u.phone LIKE ? OR u.email LIKE ?)
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      [like, like, like]
    );

    const [[{ total }]] = await pool.execute(
      'SELECT COUNT(*) as total FROM users WHERE full_name LIKE ? OR phone LIKE ? OR email LIKE ?',
      [like, like, like]
    );

    res.json({ success: true, users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// PUT /api/admin/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { is_active, role } = req.body;
    const { id } = req.params;

    if (id == req.user.id && is_active === false) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate yourself' });
    }

    await pool.execute(
      'UPDATE users SET is_active = COALESCE(?, is_active), role = COALESCE(?, role) WHERE id = ?',
      [is_active !== undefined ? is_active : null, role || null, id]
    );

    res.json({ success: true, message: 'User updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
};

// GET /api/admin/exams
exports.getExams = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, passed } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND e.status = ?'; params.push(status); }
    if (passed !== undefined) { where += ' AND e.passed = ?'; params.push(passed === 'true' ? 1 : 0); }

    const [exams] = await pool.execute(
      `SELECT e.id, e.score, e.passed, e.status, e.language, e.total_questions, e.correct_answers,
              e.started_at, e.completed_at, u.full_name, u.phone
       FROM exams e JOIN users u ON e.user_id = u.id
       ${where}
       ORDER BY e.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM exams e ${where}`,
      params
    );

    res.json({ success: true, exams, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch exams' });
  }
};

// GET /api/admin/payments
exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];
    if (status) { where += ' AND p.status = ?'; params.push(status); }

    const [payments] = await pool.execute(
      `SELECT p.id, p.amount, p.currency, p.phone_number, p.status, p.momo_transaction_id,
              p.initiated_at, p.completed_at, u.full_name, u.phone as user_phone
       FROM payments p JOIN users u ON p.user_id = u.id
       ${where}
       ORDER BY p.initiated_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const [[{ total }]] = await pool.execute(
      `SELECT COUNT(*) as total FROM payments p ${where}`, params
    );

    res.json({ success: true, payments, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payments' });
  }
};

// GET /api/admin/categories
exports.getCategories = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT c.*, COUNT(q.id) as question_count FROM categories c LEFT JOIN questions q ON q.category_id = c.id AND q.is_active = 1 GROUP BY c.id'
    );
    res.json({ success: true, categories: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories' });
  }
};

// POST /api/admin/categories
exports.createCategory = async (req, res) => {
  try {
    const { name_en, name_rw, name_fr } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO categories (name_en, name_rw, name_fr) VALUES (?, ?, ?)',
      [name_en, name_rw || name_en, name_fr || name_en]
    );
    res.status(201).json({ success: true, categoryId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to create category' });
  }
};

// GET /api/admin/settings
exports.getSettings = async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT setting_key, setting_value, description FROM system_settings');
    const settings = Object.fromEntries(rows.map((r) => [r.setting_key, { value: r.setting_value, description: r.description }]));
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

// PUT /api/admin/settings
exports.updateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // { key: value }
    for (const [key, value] of Object.entries(settings)) {
      await pool.execute(
        'UPDATE system_settings SET setting_value = ? WHERE setting_key = ?',
        [String(value), key]
      );
    }
    res.json({ success: true, message: 'Settings updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
};

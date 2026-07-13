const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const generateToken = (user) =>
  jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { full_name, phone, email, password, preferred_language = 'en' } = req.body;

    if (!full_name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Full name, phone, and password are required' });
    }

    const [existing] = await pool.execute('SELECT id FROM users WHERE phone = ?', [phone]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Phone number already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (full_name, phone, email, password_hash, preferred_language) VALUES (?, ?, ?, ?, ?)',
      [full_name, phone, email || null, hash, preferred_language]
    );

    const [users] = await pool.execute(
      'SELECT id, full_name, phone, email, role, preferred_language FROM users WHERE id = ?',
      [result.insertId]
    );

    const token = generateToken(users[0]);
    res.status(201).json({ success: true, token, user: users[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// POST /api/auth/login
exports.login = async (req, res) => {
  try {
    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Phone and password required' });
    }

    // Normalize phone — remove spaces, dashes
    phone = phone.toString().trim().replace(/[\s\-]/g, '');

    const [rows] = await pool.execute(
      'SELECT id, full_name, phone, email, role, preferred_language, is_active, password_hash FROM users WHERE phone = ?',
      [phone]
    );

    if (!rows.length) {
      console.log('Login failed: phone not found ->', phone);
      return res.status(401).json({ success: false, message: 'Phone number not registered' });
    }

    const user = rows[0];

    if (!user.is_active) {
      return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });
    }

    if (!user.password_hash) {
      console.error('User has no password hash:', user.id);
      return res.status(500).json({ success: false, message: 'Account error. Contact admin.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      console.log('Login failed: wrong password for phone ->', phone);
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    const { password_hash, ...safeUser } = user;
    const token = generateToken(safeUser);
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Login failed: ' + err.message });
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// PUT /api/auth/language
exports.updateLanguage = async (req, res) => {
  try {
    const { language } = req.body;
    if (!['en', 'rw', 'fr'].includes(language)) {
      return res.status(400).json({ success: false, message: 'Invalid language' });
    }
    await pool.execute('UPDATE users SET preferred_language = ? WHERE id = ?', [language, req.user.id]);
    res.json({ success: true, message: 'Language updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update language' });
  }
};
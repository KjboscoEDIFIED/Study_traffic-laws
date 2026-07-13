const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { requestToPay, getPaymentStatus } = require('../services/momoService');

// POST /api/payments/initiate
exports.initiatePayment = async (req, res) => {
  try {
    const { phone } = req.body;
    const userId = req.user.id;

    // Get exam price from settings
    const [settings] = await pool.execute(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'exam_price'"
    );
    const amount = settings.length ? parseFloat(settings[0].setting_value) : 100;

    // Create payment record
    const externalId = uuidv4();
    const [result] = await pool.execute(
      'INSERT INTO payments (user_id, amount, phone_number, momo_reference_id, status) VALUES (?, ?, ?, ?, ?)',
      [userId, amount, phone, externalId, 'pending']
    );

    const paymentId = result.insertId;

    // Send MoMo request

    // ─── TEST MODE: Skip MoMo API call ───────────────────────────────────────
    // TODO: When MTN MoMo account is ready, remove this block and uncomment
    // the real MoMo block below
   /* await pool.execute(
      'UPDATE payments SET status = "successful", completed_at = NOW() WHERE id = ?',
      [paymentId]
    );
    return res.json({
      success: true,
      paymentId,
      referenceId: externalId,
      amount,
      message: 'TEST MODE: Payment auto-approved.',
    });*/

    try {
      const { referenceId } = await requestToPay({
        amount,
        phone,
        externalId,
        payerMessage: 'Traffic Law Exam - 100 RWF',
        payeeNote: 'Exam Fee',
      });

      await pool.execute(
        'UPDATE payments SET momo_reference_id = ? WHERE id = ?',
        [referenceId, paymentId]
      );

      res.json({
        success: true,
        paymentId,
        referenceId,
        amount,
        message: 'Payment request sent. Check your phone for MoMo prompt.',
      });
    } catch (momoErr) {
      await pool.execute('UPDATE payments SET status = ? WHERE id = ?', ['failed', paymentId]);
      console.error('MoMo error:', momoErr.response?.data || momoErr.message);
      res.status(502).json({ success: false, message: 'Failed to initiate MoMo payment. Check your phone number.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Payment initiation failed' });
  }
};

// GET /api/payments/:paymentId/status
exports.checkStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const [rows] = await pool.execute(
      'SELECT * FROM payments WHERE id = ? AND user_id = ?',
      [paymentId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const payment = rows[0];

    // Already resolved
    if (['successful', 'failed', 'cancelled'].includes(payment.status)) {
      return res.json({ success: true, payment });
    }

    // Poll MoMo
    try {
      const momoStatus = await getPaymentStatus(payment.momo_reference_id);
      let dbStatus = payment.status;

      if (momoStatus.status === 'SUCCESSFUL') {
        dbStatus = 'successful';
        await pool.execute(
          'UPDATE payments SET status = ?, momo_transaction_id = ?, completed_at = NOW() WHERE id = ?',
          [dbStatus, momoStatus.financialTransactionId || momoStatus.externalId, paymentId]
        );
      } else if (momoStatus.status === 'FAILED') {
        dbStatus = 'failed';
        await pool.execute(
          'UPDATE payments SET status = ?, failure_reason = ? WHERE id = ?',
          [dbStatus, momoStatus.reason || 'Payment failed', paymentId]
        );
      }

      const [updated] = await pool.execute('SELECT * FROM payments WHERE id = ?', [paymentId]);
      res.json({ success: true, payment: updated[0] });
    } catch (momoErr) {
      res.json({ success: true, payment }); // Return cached status on error
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Status check failed' });
  }
};

// POST /api/payments/momo-callback (webhook)
exports.momoCallback = async (req, res) => {
  try {
    const { referenceId, status, financialTransactionId, reason } = req.body;
    if (!referenceId) return res.sendStatus(200);

    const dbStatus = status === 'SUCCESSFUL' ? 'successful' : status === 'FAILED' ? 'failed' : 'pending';

    await pool.execute(
      'UPDATE payments SET status = ?, momo_transaction_id = ?, failure_reason = ?, completed_at = IF(? = "successful", NOW(), NULL) WHERE momo_reference_id = ?',
      [dbStatus, financialTransactionId || null, reason || null, dbStatus, referenceId]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error('MoMo callback error:', err);
    res.sendStatus(500);
  }
};

// GET /api/payments/my-history
exports.myHistory = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, amount, currency, phone_number, status, initiated_at, completed_at FROM payments WHERE user_id = ? ORDER BY initiated_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json({ success: true, payments: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
};

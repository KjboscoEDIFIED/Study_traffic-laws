const express = require('express');
const router = express.Router();

const authCtrl = require('../controllers/authController');
const examCtrl = require('../controllers/examController');
const questionCtrl = require('../controllers/questionController');
const paymentCtrl = require('../controllers/paymentController');
const adminCtrl = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { uploadDocx, uploadImage } = require('../middleware/upload');

// ─── AUTH ───────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.getMe);
router.put('/auth/language', authenticate, authCtrl.updateLanguage);

// ─── PUBLIC QUESTIONS (for study) ───────────────────────
router.get('/questions', questionCtrl.getQuestions);
router.get('/questions/:id', questionCtrl.getQuestion);

// ─── PAYMENTS ───────────────────────────────────────────
router.post('/payments/initiate', authenticate, paymentCtrl.initiatePayment);
router.get('/payments/:paymentId/status', authenticate, paymentCtrl.checkStatus);
router.post('/payments/momo-callback', paymentCtrl.momoCallback); // Webhook - no auth
router.get('/payments/my-history', authenticate, paymentCtrl.myHistory);

// ─── EXAMS ──────────────────────────────────────────────
router.post('/exams/create', authenticate, examCtrl.createExam);
router.get('/exams/my-exams', authenticate, examCtrl.myExams);
router.get('/exams/:examId/questions', authenticate, examCtrl.getExamQuestions);
router.post('/exams/:examId/answer', authenticate, examCtrl.submitAnswer);
router.post('/exams/:examId/finish', authenticate, examCtrl.finishExam);

// ─── ADMIN ──────────────────────────────────────────────
router.get('/admin/dashboard', authenticate, requireAdmin, adminCtrl.getDashboardStats);
router.get('/admin/users', authenticate, requireAdmin, adminCtrl.getUsers);
router.put('/admin/users/:id', authenticate, requireAdmin, adminCtrl.updateUser);
router.get('/admin/exams', authenticate, requireAdmin, adminCtrl.getExams);
router.get('/admin/payments', authenticate, requireAdmin, adminCtrl.getPayments);
router.get('/admin/categories', authenticate, requireAdmin, adminCtrl.getCategories);
router.post('/admin/categories', authenticate, requireAdmin, adminCtrl.createCategory);
router.get('/admin/settings', authenticate, requireAdmin, adminCtrl.getSettings);
router.put('/admin/settings', authenticate, requireAdmin, adminCtrl.updateSettings);

// Admin question management
router.get('/admin/questions', authenticate, requireAdmin, questionCtrl.getQuestions);
router.post('/admin/questions', authenticate, requireAdmin, questionCtrl.createQuestion);
router.put('/admin/questions/:id', authenticate, requireAdmin, questionCtrl.updateQuestion);
router.delete('/admin/questions/:id', authenticate, requireAdmin, questionCtrl.deleteQuestion);
router.post(
  '/admin/questions/import-docx',
  authenticate,
  requireAdmin,
  uploadDocx.single('file'),
  questionCtrl.importFromDocx
);

module.exports = router;

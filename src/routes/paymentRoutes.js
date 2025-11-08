const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { paymentSchemas } = require('../validators/schemas');
const { uploadCSV } = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get('/', paymentController.getAllPayments);

/**
 * @swagger
 * /api/v1/payments/stats:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics
 */
router.get('/stats', paymentController.getPaymentStats.bind(paymentController));

/**
 * @swagger
 * /api/v1/payments/payroll-stats:
 *   get:
 *     summary: Get payroll statistics
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payroll statistics
 */
router.get('/payroll-stats', paymentController.getPayrollStats.bind(paymentController));

/**
 * @swagger
 * /api/v1/payments/single:
 *   post:
 *     summary: Process single payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employeeId:
 *                 type: string
 *               network:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post(
  '/single',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  validateRequest(paymentSchemas.singlePayment),
  paymentController.processSinglePayment
);

/**
 * @swagger
 * /api/v1/payments/batch:
 *   post:
 *     summary: Process batch payments
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/batch',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  validateRequest(paymentSchemas.batchPayment),
  paymentController.processBatchPayment
);

/**
 * @swagger
 * /api/v1/payments/batch/upload:
 *   post:
 *     summary: Upload CSV for batch payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/batch/upload',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  uploadCSV,
  paymentController.uploadBatchCSV
);

router.get('/batch/:batchId', paymentController.getBatchPayments);
router.get('/:id', paymentController.getPaymentById);
router.get('/employee/:employeeId', paymentController.getEmployeePayments);
router.post('/retry/:id', authorize(['ADMIN', 'FINANCE_MANAGER']), paymentController.retryPayment);
router.get('/status/:txHash', paymentController.getTransactionStatus);

module.exports = router;


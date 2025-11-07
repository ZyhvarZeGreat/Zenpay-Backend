const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { receiptSchemas } = require('../validators/schemas');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/receipts:
 *   get:
 *     summary: Get all receipts
 *     tags: [Receipts]
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
 *         name: network
 *         schema:
 *           type: string
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: transactionHash
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date-time
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date-time
 *     responses:
 *       200:
 *         description: List of receipts
 */
router.get(
  '/',
  validateRequest(receiptSchemas.list),
  receiptController.getAllReceipts.bind(receiptController)
);

/**
 * @swagger
 * /api/v1/receipts/stats:
 *   get:
 *     summary: Get receipt statistics
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt statistics
 */
router.get(
  '/stats',
  receiptController.getReceiptStats.bind(receiptController)
);

/**
 * @swagger
 * /api/v1/receipts/employee/{employeeId}:
 *   get:
 *     summary: Get receipts by employee
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of employee receipts
 */
router.get(
  '/employee/:employeeId',
  receiptController.getReceiptsByEmployee.bind(receiptController)
);

/**
 * @swagger
 * /api/v1/receipts/invoice/{invoiceId}:
 *   get:
 *     summary: Get receipt by invoice ID
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt details
 *       404:
 *         description: Receipt not found
 */
router.get(
  '/invoice/:invoiceId',
  receiptController.getReceiptByInvoiceId.bind(receiptController)
);

/**
 * @swagger
 * /api/v1/receipts/transaction/{txHash}:
 *   get:
 *     summary: Get receipt by transaction hash
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: txHash
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt details
 */
router.get(
  '/transaction/:txHash',
  receiptController.getReceiptByTransactionHash.bind(receiptController)
);

/**
 * @swagger
 * /api/v1/receipts/{id}:
 *   get:
 *     summary: Get receipt by ID
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt details
 *       404:
 *         description: Receipt not found
 */
router.get(
  '/:id',
  receiptController.getReceiptById.bind(receiptController)
);

/**
 * @swagger
 * /api/v1/receipts/{id}/export:
 *   get:
 *     summary: Export receipt data
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipt data for export
 */
router.get(
  '/:id/export',
  receiptController.exportReceipt.bind(receiptController)
);

module.exports = router;

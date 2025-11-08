const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { invoiceSchemas } = require('../validators/schemas');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
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
 *           enum: [DRAFT, PENDING, PAID, CANCELLED]
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get(
  '/',
  validateRequest(invoiceSchemas.list),
  invoiceController.getAllInvoices.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices/pending:
 *   get:
 *     summary: Get pending invoices
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending invoices
 */
router.get(
  '/pending',
  invoiceController.getPendingInvoices.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices/stats:
 *   get:
 *     summary: Get invoice statistics
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invoice statistics
 */
router.get(
  '/stats',
  invoiceController.getInvoiceStats.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices/employee/{employeeId}:
 *   get:
 *     summary: Get invoices by employee
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of employee invoices
 */
router.get(
  '/employee/:employeeId',
  invoiceController.getInvoicesByEmployee.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
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
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get(
  '/:id',
  invoiceController.getInvoiceById.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices:
 *   post:
 *     summary: Create new invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - amount
 *               - dueDate
 *             properties:
 *               employeeId:
 *                 type: string
 *               amount:
 *                 type: string
 *               token:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *               network:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       201:
 *         description: Invoice created
 *       400:
 *         description: Validation error
 */
router.post(
  '/',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  validateRequest(invoiceSchemas.create),
  invoiceController.createInvoice.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   put:
 *     summary: Update invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: string
 *               token:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice updated
 *       404:
 *         description: Invoice not found
 */
router.put(
  '/:id',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  validateRequest(invoiceSchemas.update),
  invoiceController.updateInvoice.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices/{id}/pay:
 *   patch:
 *     summary: Mark invoice as paid
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionHash
 *             properties:
 *               transactionHash:
 *                 type: string
 *               paidBy:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice marked as paid
 */
router.patch(
  '/:id/pay',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  validateRequest(invoiceSchemas.markPaid),
  invoiceController.markInvoicePaid.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices/{id}/resend:
 *   post:
 *     summary: Resend invoice notification
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notification sent
 */
router.post(
  '/:id/resend',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  invoiceController.resendInvoice.bind(invoiceController)
);

/**
 * @swagger
 * /api/v1/invoices/{id}:
 *   delete:
 *     summary: Cancel invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invoice cancelled
 *       404:
 *         description: Invoice not found
 */
router.delete(
  '/:id',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  invoiceController.cancelInvoice.bind(invoiceController)
);

module.exports = router;

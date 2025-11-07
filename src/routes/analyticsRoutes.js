const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
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
 *         description: Dashboard statistics
 */
router.get(
  '/dashboard',
  analyticsController.getDashboardStats.bind(analyticsController)
);

/**
 * @swagger
 * /api/v1/analytics/payments/network:
 *   get:
 *     summary: Get payment analytics by network
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Payment analytics by network
 */
router.get(
  '/payments/network',
  analyticsController.getPaymentAnalyticsByNetwork.bind(analyticsController)
);

/**
 * @swagger
 * /api/v1/analytics/employees:
 *   get:
 *     summary: Get employee analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee analytics
 */
router.get(
  '/employees',
  analyticsController.getEmployeeAnalytics.bind(analyticsController)
);

/**
 * @swagger
 * /api/v1/analytics/financial:
 *   get:
 *     summary: Get financial summary
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Financial summary
 */
router.get(
  '/financial',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  analyticsController.getFinancialSummary.bind(analyticsController)
);

module.exports = router;

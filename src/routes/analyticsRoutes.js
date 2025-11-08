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

/**
 * @swagger
 * /api/v1/analytics/charts:
 *   get:
 *     summary: Get analytics charts data
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics charts data
 */
router.get(
  '/charts',
  analyticsController.getAnalyticsCharts.bind(analyticsController)
);

/**
 * @swagger
 * /api/v1/analytics/token-distribution:
 *   get:
 *     summary: Get token distribution
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token distribution data
 */
router.get(
  '/token-distribution',
  analyticsController.getTokenDistribution.bind(analyticsController)
);

/**
 * @swagger
 * /api/v1/analytics/network-usage:
 *   get:
 *     summary: Get network usage statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Network usage statistics
 */
router.get(
  '/network-usage',
  analyticsController.getNetworkUsage.bind(analyticsController)
);

/**
 * @swagger
 * /api/v1/analytics/gas-fees:
 *   get:
 *     summary: Get gas fees statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Gas fees statistics
 */
router.get(
  '/gas-fees',
  analyticsController.getGasFeesStats.bind(analyticsController)
);

/**
 * @swagger
 * /api/v1/analytics/month-over-month:
 *   get:
 *     summary: Get month-over-month changes
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Month-over-month changes
 */
router.get(
  '/month-over-month',
  analyticsController.getMonthOverMonthChanges.bind(analyticsController)
);

module.exports = router;

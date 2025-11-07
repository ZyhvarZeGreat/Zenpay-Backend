const analyticsService = require('../services/analyticsService');
const logger = require('../utils/logger');

class AnalyticsController {
  /**
   * Get dashboard statistics
   * GET /api/v1/analytics/dashboard
   */
  async getDashboardStats(req, res, next) {
    try {
      const { network, startDate, endDate } = req.query;

      const stats = await analyticsService.getDashboardStats(network, startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      next(error);
    }
  }

  /**
   * Get payment analytics by network
   * GET /api/v1/analytics/payments/network
   */
  async getPaymentAnalyticsByNetwork(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const analytics = await analyticsService.getPaymentAnalyticsByNetwork(startDate, endDate);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting payment analytics:', error);
      next(error);
    }
  }

  /**
   * Get employee analytics
   * GET /api/v1/analytics/employees
   */
  async getEmployeeAnalytics(req, res, next) {
    try {
      const { department } = req.query;

      const analytics = await analyticsService.getEmployeeAnalytics(department);

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Error getting employee analytics:', error);
      next(error);
    }
  }

  /**
   * Get financial summary
   * GET /api/v1/analytics/financial
   */
  async getFinancialSummary(req, res, next) {
    try {
      const { startDate, endDate } = req.query;

      const summary = await analyticsService.getFinancialSummary(startDate, endDate);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Error getting financial summary:', error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();


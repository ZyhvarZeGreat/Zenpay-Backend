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

  /**
   * Get analytics charts data
   * GET /api/v1/analytics/charts
   */
  async getAnalyticsCharts(req, res, next) {
    try {
      const charts = await analyticsService.getAnalyticsCharts();

      res.json({
        success: true,
        data: charts,
      });
    } catch (error) {
      logger.error('Error getting analytics charts:', error);
      next(error);
    }
  }

  /**
   * Get token distribution
   * GET /api/v1/analytics/token-distribution
   */
  async getTokenDistribution(req, res, next) {
    try {
      const distribution = await analyticsService.getTokenDistribution();

      res.json({
        success: true,
        data: distribution,
      });
    } catch (error) {
      logger.error('Error getting token distribution:', error);
      next(error);
    }
  }

  /**
   * Get network usage statistics
   * GET /api/v1/analytics/network-usage
   */
  async getNetworkUsage(req, res, next) {
    try {
      const usage = await analyticsService.getNetworkUsage();

      res.json({
        success: true,
        data: usage,
      });
    } catch (error) {
      logger.error('Error getting network usage:', error);
      next(error);
    }
  }

  /**
   * Get gas fees statistics
   * GET /api/v1/analytics/gas-fees
   */
  async getGasFeesStats(req, res, next) {
    try {
      const stats = await analyticsService.getGasFeesStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting gas fees stats:', error);
      next(error);
    }
  }

  /**
   * Get month-over-month changes
   * GET /api/v1/analytics/month-over-month
   */
  async getMonthOverMonthChanges(req, res, next) {
    try {
      const changes = await analyticsService.getMonthOverMonthChanges();

      res.json({
        success: true,
        data: changes,
      });
    } catch (error) {
      logger.error('Error getting month-over-month changes:', error);
      next(error);
    }
  }
}

module.exports = new AnalyticsController();


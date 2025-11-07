const settingsService = require('../services/settingsService');
const logger = require('../utils/logger');

class SettingsController {
  /**
   * Get company settings
   * GET /api/v1/settings/company
   */
  async getCompanySettings(req, res, next) {
    try {
      const settings = await settingsService.getCompanySettings();
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update company settings
   * PUT /api/v1/settings/company
   */
  async updateCompanySettings(req, res, next) {
    try {
      const settings = await settingsService.updateCompanySettings(req.body);
      
      res.json({
        success: true,
        message: 'Company settings updated successfully',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payment settings
   * GET /api/v1/settings/payment
   */
  async getPaymentSettings(req, res, next) {
    try {
      const settings = await settingsService.getPaymentSettings();
      
      res.json({
        success: true,
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update payment settings
   * PUT /api/v1/settings/payment
   */
  async updatePaymentSettings(req, res, next) {
    try {
      const settings = await settingsService.updatePaymentSettings(req.body);
      
      res.json({
        success: true,
        message: 'Payment settings updated successfully',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get notification preferences
   * GET /api/v1/settings/notifications
   */
  async getNotificationPreferences(req, res, next) {
    try {
      const preferences = await settingsService.getNotificationPreferences(req.user.id);
      
      res.json({
        success: true,
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update notification preferences
   * PUT /api/v1/settings/notifications
   */
  async updateNotificationPreferences(req, res, next) {
    try {
      const preferences = await settingsService.updateNotificationPreferences(req.user.id, req.body);
      
      res.json({
        success: true,
        message: 'Notification preferences updated successfully',
        data: preferences,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SettingsController();


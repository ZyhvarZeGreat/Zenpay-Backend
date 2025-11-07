const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class SettingsService {
  /**
   * Get company settings
   */
  async getCompanySettings() {
    try {
      let settings = await prisma.companySettings.findFirst();
      
      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.companySettings.create({
          data: {
            companyName: 'Zenpay Inc.',
            defaultCurrency: 'USD',
            timezone: 'America/New_York',
            fiscalYearStart: 'January',
          },
        });
      }
      
      return settings;
    } catch (error) {
      logger.error('Error fetching company settings:', error);
      throw error;
    }
  }

  /**
   * Update company settings
   */
  async updateCompanySettings(data) {
    try {
      let settings = await prisma.companySettings.findFirst();
      
      if (!settings) {
        settings = await prisma.companySettings.create({
          data: {
            companyName: data.companyName || 'Zenpay Inc.',
            taxId: data.taxId,
            businessAddress: data.businessAddress,
            defaultCurrency: data.defaultCurrency || 'USD',
            timezone: data.timezone || 'America/New_York',
            fiscalYearStart: data.fiscalYearStart || 'January',
            logoUrl: data.logoUrl,
          },
        });
      } else {
        settings = await prisma.companySettings.update({
          where: { id: settings.id },
          data: {
            companyName: data.companyName,
            taxId: data.taxId,
            businessAddress: data.businessAddress,
            defaultCurrency: data.defaultCurrency,
            timezone: data.timezone,
            fiscalYearStart: data.fiscalYearStart,
            logoUrl: data.logoUrl,
          },
        });
      }
      
      return settings;
    } catch (error) {
      logger.error('Error updating company settings:', error);
      throw error;
    }
  }

  /**
   * Get payment settings
   */
  async getPaymentSettings() {
    try {
      let settings = await prisma.paymentSettings.findFirst();
      
      if (!settings) {
        // Create default settings if none exist
        settings = await prisma.paymentSettings.create({
          data: {
            defaultNetwork: 'POLYGON',
            defaultToken: 'USDT',
            paymentSchedule: 'MONTHLY',
            approvalThreshold: '10000',
            autoApproveSmall: true,
            verifyWalletAddresses: true,
            multiSignatureApproval: false,
          },
        });
      }
      
      return settings;
    } catch (error) {
      logger.error('Error fetching payment settings:', error);
      throw error;
    }
  }

  /**
   * Update payment settings
   */
  async updatePaymentSettings(data) {
    try {
      let settings = await prisma.paymentSettings.findFirst();
      
      if (!settings) {
        settings = await prisma.paymentSettings.create({
          data: {
            defaultNetwork: data.defaultNetwork || 'POLYGON',
            defaultToken: data.defaultToken || 'USDT',
            paymentSchedule: data.paymentSchedule || 'MONTHLY',
            approvalThreshold: data.approvalThreshold || '10000',
            autoApproveSmall: data.autoApproveSmall !== undefined ? data.autoApproveSmall : true,
            verifyWalletAddresses: data.verifyWalletAddresses !== undefined ? data.verifyWalletAddresses : true,
            multiSignatureApproval: data.multiSignatureApproval !== undefined ? data.multiSignatureApproval : false,
          },
        });
      } else {
        settings = await prisma.paymentSettings.update({
          where: { id: settings.id },
          data: {
            defaultNetwork: data.defaultNetwork,
            defaultToken: data.defaultToken,
            paymentSchedule: data.paymentSchedule,
            approvalThreshold: data.approvalThreshold,
            autoApproveSmall: data.autoApproveSmall,
            verifyWalletAddresses: data.verifyWalletAddresses,
            multiSignatureApproval: data.multiSignatureApproval,
          },
        });
      }
      
      return settings;
    } catch (error) {
      logger.error('Error updating payment settings:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences (from existing NotificationPreference model)
   */
  async getNotificationPreferences(userId) {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });
      
      if (!preferences) {
        // Create default preferences if none exist
        preferences = await prisma.notificationPreference.create({
          data: {
            userId,
            emailPaymentCompleted: true,
            emailPaymentFailed: true,
            emailInvoiceGenerated: true,
            emailApprovalRequired: true,
            inAppNotifications: true,
          },
        });
      }
      
      return preferences;
    } catch (error) {
      logger.error('Error fetching notification preferences:', error);
      throw error;
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(userId, data) {
    try {
      let preferences = await prisma.notificationPreference.findUnique({
        where: { userId },
      });
      
      if (!preferences) {
        preferences = await prisma.notificationPreference.create({
          data: {
            userId,
            emailPaymentCompleted: data.emailPaymentCompleted !== undefined ? data.emailPaymentCompleted : true,
            emailPaymentFailed: data.emailPaymentFailed !== undefined ? data.emailPaymentFailed : true,
            emailInvoiceGenerated: data.emailInvoiceGenerated !== undefined ? data.emailInvoiceGenerated : true,
            emailApprovalRequired: data.emailApprovalRequired !== undefined ? data.emailApprovalRequired : true,
            inAppNotifications: data.inAppNotifications !== undefined ? data.inAppNotifications : true,
          },
        });
      } else {
        const updateData = {};
        if (data.emailPaymentCompleted !== undefined) updateData.emailPaymentCompleted = data.emailPaymentCompleted;
        if (data.emailPaymentFailed !== undefined) updateData.emailPaymentFailed = data.emailPaymentFailed;
        if (data.emailInvoiceGenerated !== undefined) updateData.emailInvoiceGenerated = data.emailInvoiceGenerated;
        if (data.emailApprovalRequired !== undefined) updateData.emailApprovalRequired = data.emailApprovalRequired;
        if (data.inAppNotifications !== undefined) updateData.inAppNotifications = data.inAppNotifications;
        
        preferences = await prisma.notificationPreference.update({
          where: { userId },
          data: updateData,
        });
      }
      
      return preferences;
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }
}

module.exports = new SettingsService();


const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * Company Settings Routes
 */
router.get('/company', settingsController.getCompanySettings);
router.put('/company', authorize(['ADMIN']), settingsController.updateCompanySettings);

/**
 * Payment Settings Routes
 */
router.get('/payment', settingsController.getPaymentSettings);
router.put('/payment', authorize(['ADMIN', 'FINANCE_MANAGER']), settingsController.updatePaymentSettings);

/**
 * Notification Preferences Routes
 */
router.get('/notifications', settingsController.getNotificationPreferences);
router.put('/notifications', settingsController.updateNotificationPreferences);

module.exports = router;


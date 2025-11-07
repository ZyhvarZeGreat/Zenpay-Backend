const cron = require('node-cron');
const logger = require('../utils/logger');

// Placeholder sync service
function startSyncService() {
  logger.info('Sync service initialized (placeholder)');
  
  // Run every minute
  cron.schedule('*/1 * * * *', () => {
    logger.info('Sync job running...');
  });
}

startSyncService();

module.exports = { startSyncService };


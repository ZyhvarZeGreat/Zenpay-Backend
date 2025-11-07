// Simple test server without database for quick testing
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Zenpay Backend API is running!'
  });
});

// Test routes
app.get('/api/v1/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    endpoints: {
      health: '/health',
      payments: '/api/v1/payments',
      employees: '/api/v1/employees',
      analytics: '/api/v1/analytics',
    }
  });
});

// Payment routes
app.use('/api/v1/payments', require('./src/routes/paymentRoutes'));
app.use('/api/v1/employees', require('./src/routes/employeeRoutes'));
app.use('/api/v1/invoices', require('./src/routes/invoiceRoutes'));
app.use('/api/v1/analytics', require('./src/routes/analyticsRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Error:', err.message);
  res.status(500).json({ error: err.message });
});

// Start server
app.listen(PORT, () => {
  logger.info(`✅ Test server running on port ${PORT}`);
  logger.info(`📍 Health check: http://localhost:${PORT}/health`);
  logger.info(`🧪 Test endpoint: http://localhost:${PORT}/api/v1/test`);
  console.log(`\n✅ Server is running!`);
  console.log(`📍 Test it: curl http://localhost:${PORT}/health\n`);
});


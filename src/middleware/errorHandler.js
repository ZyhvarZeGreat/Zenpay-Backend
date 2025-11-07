const logger = require('../utils/logger');

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let code = 'INTERNAL_ERROR';

  // Validation errors
  if (err.name === 'ValidationError' || err.isJoi) {
    statusCode = 400;
    message = err.message;
    code = 'VALIDATION_ERROR';
  }

  // Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Resource already exists';
    code = 'CONFLICT';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Resource not found';
    code = 'NOT_FOUND';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    code = 'UNAUTHORIZED';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    code = 'UNAUTHORIZED';
  }

  // Blockchain errors
  if (err.message && err.message.includes('insufficient funds')) {
    statusCode = 503;
    message = 'Insufficient blockchain funds';
    code = 'BLOCKCHAIN_ERROR';
  }

  // Custom errors
  if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || code;
  }

  res.status(statusCode).json({
    error: message,
    code,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}

module.exports = errorHandler;


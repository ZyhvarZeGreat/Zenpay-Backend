const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Validate request using Joi schema
 */
function validateRequest(schema) {
  return (req, res, next) => {
    const validationTarget = {};
    
    if (schema.body) validationTarget.body = req.body;
    if (schema.params) validationTarget.params = req.params;
    if (schema.query) validationTarget.query = req.query;

    const { error } = Joi.object(schema).validate(validationTarget, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      logger.warn('Validation failed:', { errors, url: req.url });

      return res.status(400).json({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    next();
  };
}

module.exports = {
  validateRequest,
};


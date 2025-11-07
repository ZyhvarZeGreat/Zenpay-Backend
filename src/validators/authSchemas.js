const Joi = require('joi');

const authSchemas = {
  register: {
    body: Joi.object({
      email: Joi.string().email().required().messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required',
      }),
      password: Joi.string().min(8).required().messages({
        'string.min': 'Password must be at least 8 characters long',
        'any.required': 'Password is required',
      }),
      firstName: Joi.string().min(2).max(50).required().messages({
        'string.min': 'First name must be at least 2 characters',
        'any.required': 'First name is required',
      }),
      lastName: Joi.string().min(2).max(50).required().messages({
        'string.min': 'Last name must be at least 2 characters',
        'any.required': 'Last name is required',
      }),
      role: Joi.string().valid('ADMIN', 'FINANCE_MANAGER', 'VIEWER', 'EMPLOYEE').optional(),
    }),
  },

  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required(),
    }),
  },

  forgotPassword: {
    body: Joi.object({
      email: Joi.string().email().required(),
    }),
  },

  resetPassword: {
    body: Joi.object({
      token: Joi.string().required(),
      newPassword: Joi.string().min(8).required().messages({
        'string.min': 'New password must be at least 8 characters long',
      }),
    }),
  },

  sendOTP: {
    body: Joi.object({
      email: Joi.string().email().required(),
      purpose: Joi.string().valid('VERIFICATION', 'LOGIN', 'PASSWORD_RESET').optional(),
    }),
  },

  verifyOTP: {
    body: Joi.object({
      email: Joi.string().email().required(),
      code: Joi.string().length(6).required(),
    }),
  },

  updateProfile: {
    body: Joi.object({
      firstName: Joi.string().min(2).max(50).optional(),
      lastName: Joi.string().min(2).max(50).optional(),
      email: Joi.string().email().optional(),
    }),
  },

  changePassword: {
    body: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required().messages({
        'string.min': 'New password must be at least 8 characters long',
      }),
    }),
  },
};

module.exports = authSchemas;


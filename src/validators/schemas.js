const Joi = require('joi');

const paymentSchemas = {
  singlePayment: {
    body: Joi.object({
      employeeId: Joi.string().required(),
      network: Joi.string().valid('ETHEREUM', 'POLYGON', 'BSC').required(),
    }),
  },
  batchPayment: {
    body: Joi.object({
      employeeIds: Joi.array().items(Joi.string()).min(1).required(),
      network: Joi.string().valid('ETHEREUM', 'POLYGON', 'BSC').required(),
    }),
  },
};

const employeeSchemas = {
  create: {
    body: Joi.object({
      firstName: Joi.string().min(1).max(100).required(),
      lastName: Joi.string().min(1).max(100).required(),
      email: Joi.string().email().required(),
      walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
      department: Joi.string().min(1).max(100).required(),
      role: Joi.string().min(1).max(100).optional(),
      salaryAmount: Joi.string().required(),
      salaryToken: Joi.string().required(),
      paymentFrequency: Joi.string().valid('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY').required(),
      network: Joi.string().valid('ETHEREUM', 'POLYGON', 'BSC').required(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),
    }),
  },
  update: {
    body: Joi.object({
      firstName: Joi.string().min(1).max(100).optional(),
      lastName: Joi.string().min(1).max(100).optional(),
      email: Joi.string().email().optional(),
      walletAddress: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).optional(),
      department: Joi.string().min(1).max(100).optional(),
      role: Joi.string().min(1).max(100).optional(),
      salaryAmount: Joi.string().optional(),
      salaryToken: Joi.string().optional(),
      paymentFrequency: Joi.string().valid('WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY').optional(),
      network: Joi.string().valid('ETHEREUM', 'POLYGON', 'BSC').optional(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),
    }),
  },
  updateStatus: {
    body: Joi.object({
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').required(),
    }),
  },
  list: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('ACTIVE', 'INACTIVE', 'SUSPENDED').optional(),
      department: Joi.string().optional(),
      search: Joi.string().optional(),
    }),
  },
};

const invoiceSchemas = {
  create: {
    body: Joi.object({
      employeeId: Joi.string().required(),
      amount: Joi.string().required(),
      token: Joi.string().optional(),
      description: Joi.string().optional(),
      dueDate: Joi.date().greater('now').required(),
      network: Joi.string().valid('ETHEREUM', 'POLYGON', 'BSC').optional(),
      status: Joi.string().valid('DRAFT', 'PENDING', 'PAID', 'CANCELLED').optional(),
    }),
  },
  update: {
    body: Joi.object({
      amount: Joi.string().optional(),
      token: Joi.string().optional(),
      description: Joi.string().allow('').optional(),
      dueDate: Joi.date().greater('now').optional(),
      status: Joi.string().valid('DRAFT', 'PENDING', 'PAID', 'CANCELLED').optional(),
    }),
  },
  markPaid: {
    body: Joi.object({
      transactionHash: Joi.string().required(),
      paidBy: Joi.string().optional(),
    }),
  },
  cancel: {
    body: Joi.object({
      reason: Joi.string().optional(),
    }),
  },
  list: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      status: Joi.string().valid('DRAFT', 'PENDING', 'PAID', 'CANCELLED').optional(),
      network: Joi.string().valid('ETHEREUM', 'POLYGON', 'BSC').optional(),
      employeeId: Joi.string().optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  },
};

const receiptSchemas = {
  list: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      network: Joi.string().valid('ETHEREUM', 'POLYGON', 'BSC').optional(),
      employeeId: Joi.string().optional(),
      transactionHash: Joi.string().optional(),
      startDate: Joi.date().optional(),
      endDate: Joi.date().optional(),
    }),
  },
};

const userSchemas = {
  create: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(8).required(),
      firstName: Joi.string().min(1).max(100).required(),
      lastName: Joi.string().min(1).max(100).required(),
      role: Joi.string().valid('ADMIN', 'FINANCE_MANAGER', 'VIEWER', 'EMPLOYEE').optional(),
      isActive: Joi.boolean().optional(),
    }),
  },
  update: {
    body: Joi.object({
      firstName: Joi.string().min(1).max(100).optional(),
      lastName: Joi.string().min(1).max(100).optional(),
      email: Joi.string().email().optional(),
      role: Joi.string().valid('ADMIN', 'FINANCE_MANAGER', 'VIEWER', 'EMPLOYEE').optional(),
      isActive: Joi.boolean().optional(),
      emailVerified: Joi.boolean().optional(),
    }),
  },
  updateRole: {
    body: Joi.object({
      role: Joi.string().valid('ADMIN', 'FINANCE_MANAGER', 'VIEWER', 'EMPLOYEE').required(),
    }),
  },
  updateStatus: {
    body: Joi.object({
      isActive: Joi.boolean().required(),
    }),
  },
  resetPassword: {
    body: Joi.object({
      newPassword: Joi.string().min(8).required(),
    }),
  },
  list: {
    query: Joi.object({
      page: Joi.number().integer().min(1).optional(),
      limit: Joi.number().integer().min(1).max(100).optional(),
      role: Joi.string().valid('ADMIN', 'FINANCE_MANAGER', 'VIEWER', 'EMPLOYEE').optional(),
      isActive: Joi.string().valid('true', 'false').optional(),
      search: Joi.string().optional(),
    }),
  },
};

module.exports = {
  paymentSchemas,
  employeeSchemas,
  invoiceSchemas,
  receiptSchemas,
  userSchemas,
};


const employeeService = require('../services/employeeService');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class EmployeeController {
  /**
   * Get all employees
   * GET /api/v1/employees
   */
  async getAllEmployees(req, res, next) {
    try {
      const { page, limit, status, department, search } = req.query;
      
      const result = await employeeService.getAllEmployees({
        page,
        limit,
        status,
        department,
        search,
      });

      res.json({
        success: true,
        data: result.employees,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee by ID
   * GET /api/v1/employees/:id
   */
  async getEmployeeById(req, res, next) {
    try {
      const { id } = req.params;
      
      const employee = await employeeService.getEmployeeById(id);

      res.json({
        success: true,
        data: employee,
      });
    } catch (error) {
      if (error.message === 'Employee not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Create new employee
   * POST /api/v1/employees
   */
  async createEmployee(req, res, next) {
    try {
      const {
        firstName,
        lastName,
        email,
        walletAddress,
        department,
        role,
        salaryAmount,
        salaryToken,
        paymentFrequency,
        network,
      } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email || !walletAddress || !department || 
          !salaryAmount || !salaryToken || !paymentFrequency || !network) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
        });
      }

      // Validate wallet address format (basic check)
      if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid wallet address format',
        });
      }

      // Validate network
      const validNetworks = ['ETHEREUM', 'POLYGON', 'BSC'];
      if (!validNetworks.includes(network.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid network. Must be ETHEREUM, POLYGON, or BSC',
        });
      }

      const employee = await employeeService.createEmployee({
        firstName,
        lastName,
        email: email.toLowerCase(),
        walletAddress: walletAddress.toLowerCase(),
        department: department.toUpperCase(),
        role: role || 'Employee',
        salaryAmount,
        salaryToken,
        paymentFrequency: paymentFrequency.toUpperCase(),
        network: network.toUpperCase(),
        status: 'ACTIVE',
      });

      res.status(201).json({
        success: true,
        message: 'Employee created successfully',
        data: employee,
      });
    } catch (error) {
      if (error.message.includes('already exists') || error.message.includes('already in use')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Update employee
   * PUT /api/v1/employees/:id
   */
  async updateEmployee(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Normalize email and wallet if provided
      if (updateData.email) {
        updateData.email = updateData.email.toLowerCase();
      }
      if (updateData.walletAddress) {
        // Validate wallet address format
        if (!updateData.walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid wallet address format',
          });
        }
        updateData.walletAddress = updateData.walletAddress.toLowerCase();
      }

      // Normalize other fields
      if (updateData.department) {
        updateData.department = updateData.department.toUpperCase();
      }
      if (updateData.paymentFrequency) {
        updateData.paymentFrequency = updateData.paymentFrequency.toUpperCase();
      }
      if (updateData.network) {
        const validNetworks = ['ETHEREUM', 'POLYGON', 'BSC'];
        if (!validNetworks.includes(updateData.network.toUpperCase())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid network. Must be ETHEREUM, POLYGON, or BSC',
          });
        }
        updateData.network = updateData.network.toUpperCase();
      }

      const employee = await employeeService.updateEmployee(id, updateData);

      res.json({
        success: true,
        message: 'Employee updated successfully',
        data: employee,
      });
    } catch (error) {
      if (error.message === 'Employee not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('already in use')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Delete employee
   * DELETE /api/v1/employees/:id
   */
  async deleteEmployee(req, res, next) {
    try {
      const { id } = req.params;

      const result = await employeeService.deleteEmployee(id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error.message === 'Employee not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Update employee status
   * PATCH /api/v1/employees/:id/status
   */
  async updateEmployeeStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status
      const validStatuses = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
      if (!validStatuses.includes(status?.toUpperCase())) {
        return res.status(400).json({
          success: false,
          error: 'Invalid status. Must be ACTIVE, INACTIVE, or SUSPENDED',
        });
      }

      const employee = await employeeService.updateEmployeeStatus(id, status.toUpperCase());

      res.json({
        success: true,
        message: 'Employee status updated successfully',
        data: employee,
      });
    } catch (error) {
      if (error.message === 'Employee not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Get employees by department
   * GET /api/v1/employees/department/:dept
   */
  async getEmployeesByDepartment(req, res, next) {
    try {
      const { dept } = req.params;

      const employees = await employeeService.getEmployeesByDepartment(dept);

      res.json({
        success: true,
        data: employees,
        count: employees.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active employees
   * GET /api/v1/employees/active
   */
  async getActiveEmployees(req, res, next) {
    try {
      const employees = await employeeService.getActiveEmployees();

      res.json({
        success: true,
        data: employees,
        count: employees.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee payment history
   * GET /api/v1/employees/:id/payments
   */
  async getEmployeePaymentHistory(req, res, next) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;

      // Verify employee exists
      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found',
        });
      }

      const result = await employeeService.getEmployeePaymentHistory(id, { page, limit });

      res.json({
        success: true,
        data: result.payments,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get employee statistics
   * GET /api/v1/employees/stats
   */
  async getEmployeeStats(req, res, next) {
    try {
      const stats = await employeeService.getEmployeeStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting employee stats:', error);
      next(error);
    }
  }
}

module.exports = new EmployeeController();


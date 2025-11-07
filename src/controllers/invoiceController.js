const invoiceService = require('../services/invoiceService');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class InvoiceController {
  /**
   * Get all invoices
   * GET /api/v1/invoices
   */
  async getAllInvoices(req, res, next) {
    try {
      const { page, limit, status, network, employeeId, startDate, endDate } = req.query;
      
      const result = await invoiceService.getAllInvoices({
        page,
        limit,
        status,
        network,
        employeeId,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: result.invoices,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invoice by ID
   * GET /api/v1/invoices/:id
   */
  async getInvoiceById(req, res, next) {
    try {
      const { id } = req.params;
      
      const invoice = await invoiceService.getInvoiceById(id);

      res.json({
        success: true,
        data: invoice,
      });
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Create new invoice
   * POST /api/v1/invoices
   */
  async createInvoice(req, res, next) {
    try {
      const {
        employeeId,
        amount,
        token,
        description,
        dueDate,
        network,
        status,
      } = req.body;

      // Validate required fields
      if (!employeeId || !amount || !dueDate) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID, amount, and due date are required',
        });
      }

      // Validate due date is in the future
      if (new Date(dueDate) < new Date()) {
        return res.status(400).json({
          success: false,
          error: 'Due date must be in the future',
        });
      }

      const invoice = await invoiceService.createInvoice({
        employeeId,
        amount,
        token,
        description,
        dueDate,
        network,
        status,
      });

      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Update invoice
   * PUT /api/v1/invoices/:id
   */
  async updateInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate due date if provided
      if (updateData.dueDate) {
        if (new Date(updateData.dueDate) < new Date()) {
          return res.status(400).json({
            success: false,
            error: 'Due date must be in the future',
          });
        }
      }

      const invoice = await invoiceService.updateInvoice(id, updateData);

      res.json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      });
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('Cannot update')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Cancel invoice
   * DELETE /api/v1/invoices/:id
   */
  async cancelInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const invoice = await invoiceService.cancelInvoice(id, reason);

      res.json({
        success: true,
        message: 'Invoice cancelled successfully',
        data: invoice,
      });
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('Cannot cancel') || error.message.includes('already')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Mark invoice as paid
   * PATCH /api/v1/invoices/:id/pay
   */
  async markInvoicePaid(req, res, next) {
    try {
      const { id } = req.params;
      const { transactionHash, paidBy } = req.body;

      if (!transactionHash) {
        return res.status(400).json({
          success: false,
          error: 'Transaction hash is required',
        });
      }

      const invoice = await invoiceService.markInvoicePaid(
        id,
        transactionHash,
        paidBy || req.user.id
      );

      res.json({
        success: true,
        message: 'Invoice marked as paid',
        data: invoice,
      });
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('already') || error.message.includes('Cannot mark')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Get invoices by employee
   * GET /api/v1/invoices/employee/:employeeId
   */
  async getInvoicesByEmployee(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { page, limit, status } = req.query;

      // Verify employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          error: 'Employee not found',
        });
      }

      const result = await invoiceService.getInvoicesByEmployee(employeeId, {
        page,
        limit,
        status,
      });

      res.json({
        success: true,
        data: result.invoices,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending invoices
   * GET /api/v1/invoices/pending
   */
  async getPendingInvoices(req, res, next) {
    try {
      const { network } = req.query;

      const invoices = await invoiceService.getPendingInvoices(network);

      res.json({
        success: true,
        data: invoices,
        count: invoices.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend invoice notification
   * POST /api/v1/invoices/:id/resend
   */
  async resendInvoice(req, res, next) {
    try {
      const { id } = req.params;
      const { email } = req.body;

      const result = await invoiceService.resendInvoiceNotification(id, email);

      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }
}

module.exports = new InvoiceController();


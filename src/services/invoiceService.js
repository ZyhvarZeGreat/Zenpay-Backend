const blockchainService = require('./blockchainService');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class InvoiceService {
  /**
   * Get all invoices with pagination and filters
   */
  async getAllInvoices({ page = 1, limit = 10, status, network, employeeId, startDate, endDate }) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (network) {
        where.network = network;
      }
      
      if (employeeId) {
        where.employeeId = employeeId;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      // Get invoices and total count
      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: parseInt(limit),
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                walletAddress: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.invoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching invoices:', error);
      throw error;
    }
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          employee: true,
          receipt: true,
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      logger.error(`Error fetching invoice ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new invoice
   */
  async createInvoice(data) {
    try {
      // Validate employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: data.employeeId },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      if (employee.status !== 'ACTIVE') {
        throw new Error('Cannot create invoice for inactive employee');
      }

      // Use employee's network if not specified
      const network = data.network || employee.network;

      // Get the next blockchain ID
      const lastInvoice = await prisma.invoice.findFirst({
        orderBy: { blockchainId: 'desc' },
      });

      const blockchainId = lastInvoice ? lastInvoice.blockchainId + 1 : 1;

      // Create invoice
      const invoice = await prisma.invoice.create({
        data: {
          employeeId: data.employeeId,
          amount: data.amount,
          token: data.token || employee.salaryToken,
          status: data.status || 'DRAFT',
          description: data.description,
          dueDate: new Date(data.dueDate),
          network: network,
          blockchainId,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              walletAddress: true,
            },
          },
        },
      });

      logger.info(`Invoice created: ${invoice.id} for employee ${data.employeeId}`);

      // Create on blockchain if status is PENDING (async)
      if (invoice.status === 'PENDING') {
        this._createInvoiceOnBlockchain(invoice.id, network, {
          employeeId: employee.blockchainId,
          employeeWallet: employee.walletAddress,
          amount: invoice.amount,
          token: invoice.token,
          dueDate: invoice.dueDate,
          description: invoice.description,
        }).catch(error => {
          logger.error(`Blockchain creation failed for invoice ${invoice.id}:`, error);
        });
      }

      return invoice;
    } catch (error) {
      logger.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   */
  async updateInvoice(id, data) {
    try {
      // Check if invoice exists
      const existing = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Invoice not found');
      }

      // Cannot update paid or cancelled invoices
      if (existing.status === 'PAID' || existing.status === 'CANCELLED') {
        throw new Error('Cannot update paid or cancelled invoice');
      }

      // Prepare update data
      const updateData = {};
      if (data.amount) updateData.amount = data.amount;
      if (data.token) updateData.token = data.token;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.dueDate) updateData.dueDate = new Date(data.dueDate);
      if (data.status) {
        updateData.status = data.status;
        
        // Create on blockchain when status changes to PENDING
        if (data.status === 'PENDING' && existing.status !== 'PENDING') {
          const employee = await prisma.employee.findUnique({
            where: { id: existing.employeeId },
          });
          
          this._createInvoiceOnBlockchain(id, existing.network, {
            employeeId: employee.blockchainId,
            employeeWallet: employee.walletAddress,
            amount: updateData.amount || existing.amount,
            token: updateData.token || existing.token,
            dueDate: updateData.dueDate || existing.dueDate,
            description: updateData.description || existing.description,
          }).catch(error => {
            logger.error(`Blockchain creation failed for invoice ${id}:`, error);
          });
        }
      }

      // Update invoice
      const invoice = await prisma.invoice.update({
        where: { id },
        data: updateData,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              walletAddress: true,
            },
          },
        },
      });

      logger.info(`Invoice updated: ${id}`);
      return invoice;
    } catch (error) {
      logger.error(`Error updating invoice ${id}:`, error);
      throw error;
    }
  }

  /**
   * Cancel invoice
   */
  async cancelInvoice(id, reason) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'PAID') {
        throw new Error('Cannot cancel paid invoice');
      }

      if (invoice.status === 'CANCELLED') {
        throw new Error('Invoice is already cancelled');
      }

      // Update invoice status
      const updated = await prisma.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          description: reason 
            ? `${invoice.description || ''}\n\nCancelled: ${reason}`.trim()
            : invoice.description,
        },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      logger.info(`Invoice cancelled: ${id}`);
      return updated;
    } catch (error) {
      logger.error(`Error cancelling invoice ${id}:`, error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   */
  async markInvoicePaid(id, transactionHash, paidBy) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'PAID') {
        throw new Error('Invoice is already paid');
      }

      if (invoice.status === 'CANCELLED') {
        throw new Error('Cannot mark cancelled invoice as paid');
      }

      // Update invoice
      const updated = await prisma.invoice.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          transactionHash,
        },
        include: {
          employee: true,
        },
      });

      // Create receipt
      await prisma.receipt.create({
        data: {
          invoiceId: id,
          employeeId: invoice.employeeId,
          amount: invoice.amount,
          token: invoice.token,
          transactionHash,
          paidAt: new Date(),
          paidBy: paidBy || 'SYSTEM',
          network: invoice.network,
        },
      });

      logger.info(`Invoice marked as paid: ${id}`);
      return updated;
    } catch (error) {
      logger.error(`Error marking invoice as paid ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get invoices by employee
   */
  async getInvoicesByEmployee(employeeId, { page = 1, limit = 10, status }) {
    try {
      const skip = (page - 1) * limit;
      
      const where = { employeeId };
      if (status) {
        where.status = status;
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.invoice.count({ where }),
      ]);

      return {
        invoices,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching invoices for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get pending invoices
   */
  async getPendingInvoices(network) {
    try {
      const where = { status: 'PENDING' };
      if (network) {
        where.network = network;
      }

      const invoices = await prisma.invoice.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              walletAddress: true,
            },
          },
        },
        orderBy: { dueDate: 'asc' },
      });

      return invoices;
    } catch (error) {
      logger.error('Error fetching pending invoices:', error);
      throw error;
    }
  }

  /**
   * Internal: Create invoice on blockchain
   */
  async _createInvoiceOnBlockchain(invoiceId, network, invoiceData) {
    try {
      const result = await blockchainService.createInvoice(network, invoiceData);

      if (result.success) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            transactionHash: result.transactionHash,
            blockchainId: result.blockchainId,
          },
        });

        logger.info(`Invoice ${invoiceId} created on blockchain: ${result.transactionHash}`);
      } else {
        logger.error(`Failed to create invoice ${invoiceId} on blockchain`);
      }
    } catch (error) {
      logger.error(`Error creating invoice ${invoiceId} on blockchain:`, error);
    }
  }

  /**
   * Resend invoice notification
   */
  async resendInvoiceNotification(invoiceId, email) {
    try {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          employee: true,
        },
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // This would integrate with email service
      // For now, we'll just log it
      logger.info(`Resending invoice notification: ${invoiceId} to ${email || invoice.employee.email}`);

      return {
        success: true,
        message: 'Invoice notification sent',
        email: email || invoice.employee.email,
      };
    } catch (error) {
      logger.error(`Error resending invoice notification ${invoiceId}:`, error);
      throw error;
    }
  }
}

module.exports = new InvoiceService();


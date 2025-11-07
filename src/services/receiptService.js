const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class ReceiptService {
  /**
   * Get all receipts with pagination and filters
   */
  async getAllReceipts({ page = 1, limit = 10, network, employeeId, startDate, endDate, transactionHash }) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where = {};
      
      if (network) {
        where.network = network;
      }
      
      if (employeeId) {
        where.employeeId = employeeId;
      }
      
      if (transactionHash) {
        where.transactionHash = transactionHash;
      }
      
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      // Get receipts and total count
      const [receipts, total] = await Promise.all([
        prisma.receipt.findMany({
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
            invoice: {
              select: {
                id: true,
                amount: true,
                token: true,
                description: true,
                dueDate: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.receipt.count({ where }),
      ]);

      return {
        receipts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching receipts:', error);
      throw error;
    }
  }

  /**
   * Get receipt by ID
   */
  async getReceiptById(id) {
    try {
      const receipt = await prisma.receipt.findUnique({
        where: { id },
        include: {
          employee: true,
          invoice: true,
        },
      });

      if (!receipt) {
        throw new Error('Receipt not found');
      }

      return receipt;
    } catch (error) {
      logger.error(`Error fetching receipt ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get receipt by invoice ID
   */
  async getReceiptByInvoiceId(invoiceId) {
    try {
      const receipt = await prisma.receipt.findUnique({
        where: { invoiceId },
        include: {
          employee: true,
          invoice: true,
        },
      });

      if (!receipt) {
        throw new Error('Receipt not found for this invoice');
      }

      return receipt;
    } catch (error) {
      logger.error(`Error fetching receipt for invoice ${invoiceId}:`, error);
      throw error;
    }
  }

  /**
   * Get receipt by transaction hash
   */
  async getReceiptByTransactionHash(txHash) {
    try {
      const receipt = await prisma.receipt.findFirst({
        where: { transactionHash: txHash },
        include: {
          employee: true,
          invoice: true,
        },
      });

      if (!receipt) {
        throw new Error('Receipt not found');
      }

      return receipt;
    } catch (error) {
      logger.error(`Error fetching receipt for transaction ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Get receipts by employee
   */
  async getReceiptsByEmployee(employeeId, { page = 1, limit = 10 }) {
    try {
      const skip = (page - 1) * limit;

      // Verify employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const [receipts, total] = await Promise.all([
        prisma.receipt.findMany({
          where: { employeeId },
          skip,
          take: parseInt(limit),
          include: {
            invoice: {
              select: {
                id: true,
                description: true,
                dueDate: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.receipt.count({ where: { employeeId } }),
      ]);

      return {
        receipts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching receipts for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get receipt statistics
   */
  async getReceiptStats(network, startDate, endDate) {
    try {
      const where = {};
      if (network) where.network = network;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [total, totalAmount, receipts] = await Promise.all([
        prisma.receipt.count({ where }),
        prisma.receipt.findMany({
          where,
          select: { amount: true },
        }),
        prisma.receipt.findMany({
          where,
          select: {
            network: true,
            token: true,
            amount: true,
          },
        }),
      ]);

      // Calculate total amount (amounts are stored as strings)
      const totalAmountSum = receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

      // Group by network
      const byNetwork = receipts.reduce((acc, r) => {
        if (!acc[r.network]) {
          acc[r.network] = { count: 0, total: 0 };
        }
        acc[r.network].count++;
        acc[r.network].total += parseFloat(r.amount || 0);
        return acc;
      }, {});

      // Group by token
      const byToken = receipts.reduce((acc, r) => {
        if (!acc[r.token]) {
          acc[r.token] = { count: 0, total: 0 };
        }
        acc[r.token].count++;
        acc[r.token].total += parseFloat(r.amount || 0);
        return acc;
      }, {});

      return {
        total,
        totalAmount: totalAmountSum.toString(),
        byNetwork,
        byToken,
      };
    } catch (error) {
      logger.error('Error getting receipt stats:', error);
      throw error;
    }
  }

  /**
   * Generate receipt data for export/download
   */
  async generateReceiptData(receiptId) {
    try {
      const receipt = await prisma.receipt.findUnique({
        where: { id: receiptId },
        include: {
          employee: true,
          invoice: true,
        },
      });

      if (!receipt) {
        throw new Error('Receipt not found');
      }

      // Format receipt data for export (PDF, email, etc.)
      return {
        receiptNumber: `REC-${receipt.blockchainId || receipt.id.slice(0, 8).toUpperCase()}`,
        invoiceNumber: `INV-${receipt.invoice.blockchainId || receipt.invoice.id.slice(0, 8).toUpperCase()}`,
        date: receipt.paidAt,
        employee: {
          name: `${receipt.employee.firstName} ${receipt.employee.lastName}`,
          email: receipt.employee.email,
          walletAddress: receipt.employee.walletAddress,
        },
        amount: receipt.amount,
        token: receipt.token,
        network: receipt.network,
        transactionHash: receipt.transactionHash,
        description: receipt.invoice.description,
        paidBy: receipt.paidBy,
      };
    } catch (error) {
      logger.error(`Error generating receipt data for ${receiptId}:`, error);
      throw error;
    }
  }
}

module.exports = new ReceiptService();


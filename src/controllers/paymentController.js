const paymentService = require('../services/paymentService');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class PaymentController {
  /**
   * Get payment statistics
   * GET /api/v1/payments/stats
   */
  async getPaymentStats(req, res, next) {
    try {
      const stats = await paymentService.getPaymentStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting payment stats:', error);
      next(error);
    }
  }

  /**
   * Get payroll statistics
   * GET /api/v1/payments/payroll-stats
   */
  async getPayrollStats(req, res, next) {
    try {
      const stats = await paymentService.getPayrollStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      logger.error('Error getting payroll stats:', error);
      next(error);
    }
  }

  /**
   * Get all payments with pagination
   */
  async getAllPayments(req, res, next) {
    try {
      const { page = 1, limit = 20, status, network, startDate, endDate } = req.query;
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const where = {};
      if (status) where.status = status;
      if (network) where.network = network;
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          skip,
          take,
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                walletAddress: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.count({ where }),
      ]);

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process single salary payment
   */
  async processSinglePayment(req, res, next) {
    try {
      const { employeeId, network } = req.body;

      if (!employeeId || !network) {
        return res.status(400).json({
          success: false,
          error: 'Employee ID and network are required',
        });
      }

      logger.info(`Processing single payment: employee=${employeeId}, network=${network}`);

      const result = await paymentService.processSinglePayment(employeeId, network, req.user.id);

      res.json({
        success: true,
        message: 'Payment processing initiated',
        data: result,
      });
    } catch (error) {
      logger.error('Single payment failed:', error);
      
      const errorMessage = error.message || error.reason || 'Payment processing failed';
      
      if (error.message?.includes('not found') || error.message?.includes('not active')) {
        return res.status(404).json({
          success: false,
          error: errorMessage,
        });
      }
      
      if (error.message?.includes('mismatch') || error.message?.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: errorMessage,
        });
      }
      
      // Return 500 for transaction/blockchain errors with detailed message
      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: error.reason || error.data || null,
      });
    }
  }

  /**
   * Process batch payments
   */
  async processBatchPayment(req, res, next) {
    try {
      const { employeeIds, network } = req.body;

      if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Employee IDs array is required',
        });
      }

      if (!network) {
        return res.status(400).json({
          success: false,
          error: 'Network is required',
        });
      }

      logger.info(`Processing batch payment: ${employeeIds.length} employees on ${network}`);

      const result = await paymentService.processBatchPayment(employeeIds, network, req.user.id);

      res.json({
        success: true,
        message: 'Batch payment processing started',
        data: result,
      });
    } catch (error) {
      logger.error('Batch payment failed:', error);
      
      const errorMessage = error.message || error.reason || 'Batch payment processing failed';
      
      if (error.message?.includes('No employees') || error.message?.includes('No active')) {
        return res.status(404).json({
          success: false,
          error: errorMessage,
        });
      }
      
      if (error.message?.includes('Invalid network')) {
        return res.status(400).json({
          success: false,
          error: errorMessage,
        });
      }
      
      // Return 500 for transaction/blockchain errors with detailed message
      return res.status(500).json({
        success: false,
        error: errorMessage,
        details: error.reason || error.data || null,
      });
    }
  }

  /**
   * Upload CSV for batch payment
   */
  async uploadBatchCSV(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'No file uploaded',
        });
      }

      // Validate file type
      if (!req.file.originalname.endsWith('.csv')) {
        return res.status(400).json({
          success: false,
          error: 'Only CSV files are allowed',
        });
      }

      const result = await paymentService.processBatchCSV(req.file, req.user.id);

      res.json({
        success: true,
        message: 'Batch CSV processed successfully',
        data: result,
      });
    } catch (error) {
      logger.error('CSV upload failed:', error);
      
      if (error.message.includes('empty') || error.message.includes('No active')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      
      next(error);
    }
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(req, res, next) {
    try {
      const { id } = req.params;

      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          employee: true,
          batch: true,
        },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found',
        });
      }

      res.json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get payments by batch ID
   */
  async getBatchPayments(req, res, next) {
    try {
      const { batchId } = req.params;

      const payments = await prisma.payment.findMany({
        where: { batchId },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              walletAddress: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });

      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
      });

      res.json({
        success: true,
        data: {
          batch: batch || null,
          payments,
        },
      });
    } catch (error) {
      logger.error('Error fetching batch payments:', error);
      next(error);
    }
  }

  /**
   * Get employee payment history
   */
  async getEmployeePayments(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: { employeeId },
          skip,
          take,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.count({ where: { employeeId } }),
      ]);

      res.json({
        success: true,
        data: payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(req, res, next) {
    try {
      const { id } = req.params;

      const result = await paymentService.retryPayment(id, req.user.id);

      res.json({
        success: true,
        message: 'Payment retry initiated',
        data: result,
      });
    } catch (error) {
      logger.error('Payment retry failed:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      
      if (error.message.includes('Only failed') || error.message.includes('Insufficient balance')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      
      next(error);
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(req, res, next) {
    try {
      const { txHash } = req.params;

      const payment = await prisma.payment.findFirst({
        where: { transactionHash: txHash },
        include: { employee: true },
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Transaction not found',
        });
      }

      // Get blockchain details if transaction hash exists
      let blockchainDetails = null;
      if (payment.transactionHash && payment.network) {
        try {
          const { getTransactionReceipt, getCurrentBlock, getProvider } = require('../config/blockchain');
          const { ethers } = require('ethers');
          
          const receipt = await getTransactionReceipt(payment.network, payment.transactionHash);
          const currentBlock = await getCurrentBlock(payment.network);
          const provider = getProvider(payment.network);
          
          // Get transaction details
          const tx = await provider.getTransaction(payment.transactionHash);
          
          // Get block details
          const block = await provider.getBlock(receipt.blockNumber);
          
          // Calculate confirmations
          const confirmations = currentBlock - receipt.blockNumber + 1;
          
          // Calculate gas fees
          const gasUsed = receipt.gasUsed.toString();
          const gasPrice = tx.gasPrice ? tx.gasPrice.toString() : '0';
          const gasFee = BigInt(gasUsed) * BigInt(gasPrice);
          
          // Get fee data for EIP-1559 transactions
          let baseFee = null;
          let maxFeePerGas = null;
          let maxPriorityFeePerGas = null;
          
          if (tx.maxFeePerGas) {
            maxFeePerGas = tx.maxFeePerGas.toString();
            maxPriorityFeePerGas = tx.maxPriorityFeePerGas?.toString() || '0';
            baseFee = block.baseFeePerGas ? block.baseFeePerGas.toString() : null;
          }
          
          blockchainDetails = {
            blockNumber: receipt.blockNumber,
            blockHash: receipt.blockHash,
            blockTimestamp: block.timestamp,
            confirmations,
            gasUsed,
            gasLimit: tx.gasLimit.toString(),
            gasPrice: gasPrice,
            baseFee,
            maxFeePerGas,
            maxPriorityFeePerGas,
            gasFee: gasFee.toString(),
            gasFeeFormatted: ethers.formatEther(gasFee),
            status: receipt.status === 1 ? 'success' : 'failed',
            from: tx.from,
            to: tx.to,
            nonce: tx.nonce,
            transactionIndex: receipt.transactionIndex,
            logs: receipt.logs.length,
          };
        } catch (blockchainError) {
          logger.warn(`Could not fetch blockchain details for ${payment.transactionHash}:`, blockchainError.message);
          // Continue without blockchain details
        }
      }

      res.json({
        success: true,
        data: {
          ...payment,
          blockchainDetails,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();


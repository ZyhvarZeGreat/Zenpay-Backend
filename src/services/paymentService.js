const blockchainService = require('./blockchainService');
const walletService = require('./walletService');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const csv = require('csv-parser');
const { Readable } = require('stream');

class PaymentService {
  /**
   * Process single salary payment
   */
  async processSinglePayment(employeeId, network, userId) {
    try {
      // Get employee
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      if (employee.status !== 'ACTIVE') {
        throw new Error('Employee is not active');
      }

      if (employee.network !== network.toUpperCase()) {
        throw new Error(`Employee network mismatch. Employee is on ${employee.network}, but payment requested for ${network}`);
      }

      // Check wallet balance before processing
      const token = employee.salaryToken === 'ETH' ? 'native' : employee.salaryToken;
      const hasBalance = await walletService.hasSufficientBalance(network, token, employee.salaryAmount);

      if (!hasBalance) {
        throw new Error(`Insufficient balance in company wallet. Required: ${employee.salaryAmount} ${employee.salaryToken}, Network: ${network}`);
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          employeeId: employee.id,
          walletAddress: employee.walletAddress,
          amount: employee.salaryAmount,
          token: employee.salaryToken,
          network: employee.network,
          status: 'PROCESSING',
        },
      });

      logger.info(`Processing payment ${payment.id} for employee ${employeeId} on ${network}`);

      // Process payment on blockchain (async - don't await)
      this._processPaymentOnBlockchain(payment.id, employee.blockchainId, network, employee.salaryAmount, employee.salaryToken, employee.walletAddress, userId)
        .catch(error => {
          logger.error(`Blockchain processing failed for payment ${payment.id}:`, error);
        });

      return {
        paymentId: payment.id,
        employeeId: employee.id,
        amount: employee.salaryAmount,
        token: employee.salaryToken,
        network: employee.network,
        status: 'PROCESSING',
      };
    } catch (error) {
      logger.error(`Error processing single payment for ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Process batch payments
   */
  async processBatchPayment(employeeIds, network, userId) {
    try {
      if (!employeeIds || employeeIds.length === 0) {
        throw new Error('No employees provided');
      }

      // Validate network
      const validNetworks = ['ETHEREUM', 'POLYGON', 'BSC'];
      if (!validNetworks.includes(network.toUpperCase())) {
        throw new Error('Invalid network');
      }

      // Get employees
      const employees = await prisma.employee.findMany({
        where: {
          id: { in: employeeIds },
          status: 'ACTIVE',
          network: network.toUpperCase(),
        },
      });

      if (employees.length === 0) {
        throw new Error('No active employees found for the specified network');
      }

      if (employees.length !== employeeIds.length) {
        const foundIds = employees.map(e => e.id);
        const missingIds = employeeIds.filter(id => !foundIds.includes(id));
        logger.warn(`Some employees not found or inactive: ${missingIds.join(', ')}`);
      }

      // Calculate total amount
      const totalAmount = employees.reduce((sum, emp) => {
        return sum + parseFloat(emp.salaryAmount);
      }, 0).toString();

      const token = employees[0].salaryToken; // Assume all use same token

      // Check wallet balance for batch
      const tokenForBalance = token === 'ETH' ? 'native' : token;
      const hasBalance = await walletService.hasSufficientBalance(network, tokenForBalance, totalAmount);

      if (!hasBalance) {
        throw new Error(`Insufficient balance in company wallet. Required: ${totalAmount} ${token}, Network: ${network}`);
      }

      // Create batch record
      const batch = await prisma.batch.create({
        data: {
          totalAmount,
          token,
          paymentCount: employees.length,
          network: network.toUpperCase(),
          status: 'PROCESSING',
          createdBy: userId,
        },
      });

      logger.info(`Created batch ${batch.id} with ${employees.length} payments`);

      // Create payment records
      const payments = await Promise.all(
        employees.map(employee =>
          prisma.payment.create({
            data: {
              batchId: batch.id,
              employeeId: employee.id,
              walletAddress: employee.walletAddress,
              amount: employee.salaryAmount,
              token: employee.salaryToken,
              network: employee.network,
              status: 'PROCESSING',
            },
          })
        )
      );

      // Process batch on blockchain (async)
      this._processBatchOnBlockchain(batch.id, employees.map(e => e.blockchainId), network, totalAmount, token, userId)
        .catch(error => {
          logger.error(`Blockchain processing failed for batch ${batch.id}:`, error);
        });

      return {
        batchId: batch.id,
        paymentCount: payments.length,
        totalAmount,
        token,
        network: network.toUpperCase(),
        status: 'PROCESSING',
      };
    } catch (error) {
      logger.error('Error processing batch payment:', error);
      throw error;
    }
  }

  /**
   * Process CSV file for batch payment
   */
  async processBatchCSV(file, userId) {
    try {
      if (!file || !file.buffer) {
        throw new Error('No file provided');
      }

      const results = [];
      const stream = Readable.from(file.buffer.toString());

      return new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (data) => {
            // Expected CSV format: employeeId,amount,token (optional)
            results.push({
              employeeId: data.employeeId || data.employee_id,
              amount: data.amount,
              token: data.token || 'USDT',
            });
          })
          .on('end', async () => {
            try {
              if (results.length === 0) {
                throw new Error('CSV file is empty');
              }

              // Validate and get employees
              const employeeIds = results.map(r => r.employeeId);
              const employees = await prisma.employee.findMany({
                where: {
                  id: { in: employeeIds },
                  status: 'ACTIVE',
                },
              });

              if (employees.length === 0) {
                throw new Error('No active employees found in CSV');
              }

              // Group by network
              const employeesByNetwork = {};
              employees.forEach(emp => {
                if (!employeesByNetwork[emp.network]) {
                  employeesByNetwork[emp.network] = [];
                }
                employeesByNetwork[emp.network].push(emp.id);
              });

              // Process each network separately
              const batches = [];
              for (const [network, ids] of Object.entries(employeesByNetwork)) {
                const batch = await this.processBatchPayment(ids, network, userId);
                batches.push(batch);
              }

              resolve({
                success: true,
                message: `Processed ${employees.length} employees across ${batches.length} batch(es)`,
                batches,
                processed: employees.length,
                totalRows: results.length,
              });
            } catch (error) {
              reject(error);
            }
          })
          .on('error', reject);
      });
    } catch (error) {
      logger.error('Error processing CSV:', error);
      throw error;
    }
  }

  /**
   * Retry failed payment
   */
  async retryPayment(paymentId, userId) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { employee: true },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'FAILED') {
        throw new Error('Only failed payments can be retried');
      }

      // Check wallet balance before retry
      const token = payment.token === 'ETH' ? 'native' : payment.token;
      const hasBalance = await walletService.hasSufficientBalance(payment.network, token, payment.amount);

      if (!hasBalance) {
        throw new Error(`Insufficient balance in company wallet. Required: ${payment.amount} ${payment.token}, Network: ${payment.network}`);
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'PROCESSING',
          failureReason: null,
        },
      });

      // Retry on blockchain
      this._processPaymentOnBlockchain(payment.id, payment.employee.blockchainId, payment.network, payment.amount, payment.token, payment.walletAddress, userId || 'SYSTEM')
        .catch(error => {
          logger.error(`Retry failed for payment ${paymentId}:`, error);
        });

      logger.info(`Retrying payment ${paymentId}`);
      return {
        paymentId,
        status: 'PROCESSING',
        message: 'Payment retry initiated',
      };
    } catch (error) {
      logger.error(`Error retrying payment ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Internal: Process payment on blockchain (using direct token transfer)
   */
  async _processPaymentOnBlockchain(paymentId, employeeBlockchainId, network, amount, token, recipientAddress, userId) {
    try {
      // Use direct token transfer instead of smart contract
      const result = await blockchainService.transferToken(network, recipientAddress, amount, token);

      if (result.success) {
        // Update payment with transaction details
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETED',
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            completedAt: new Date(),
          },
        });

        // Record withdrawal from company wallet
        const tokenForWithdrawal = token === 'ETH' ? 'native' : token;
        await walletService.recordWithdrawal(
          network,
          result.transactionHash,
          amount,
          tokenForWithdrawal,
          recipientAddress,
          'PAYMENT',
          userId,
          paymentId
        ).catch(error => {
          logger.error(`Error recording withdrawal for payment ${paymentId}:`, error);
        });

        // Create notification (if notification service exists)
        await this._createNotification(paymentId, 'PAYMENT_COMPLETED');

        logger.info(`Payment ${paymentId} completed: ${result.transactionHash}`);
      } else {
        // Mark as failed with detailed error message
        const errorMessage = result.error || 'Payment processing failed';
        await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'FAILED',
            failureReason: errorMessage,
          },
        });

        await this._createNotification(paymentId, 'PAYMENT_FAILED');
        logger.error(`Payment ${paymentId} failed: ${errorMessage}`);
        
        // Throw error to propagate to frontend
        throw new Error(errorMessage);
      }
    } catch (error) {
      // Mark as failed with detailed error message
      const errorMessage = error.message || error.reason || 'Payment processing error';
      await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: 'FAILED',
          failureReason: errorMessage,
        },
      });

      logger.error(`Error processing payment ${paymentId} on blockchain:`, errorMessage);
      
      // Re-throw with detailed message for frontend
      throw new Error(errorMessage);
    }
  }

  /**
   * Internal: Process batch on blockchain (using direct token transfers)
   */
  async _processBatchOnBlockchain(batchId, employeeBlockchainIds, network, totalAmount, token, userId) {
    try {
      // Get batch with payments
      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { payments: { include: { employee: true } } },
      });

      if (!batch) {
        throw new Error(`Batch ${batchId} not found`);
      }

      // Process each payment individually using direct transfer
      const results = [];
      const errors = [];

      for (const payment of batch.payments) {
        try {
          const result = await blockchainService.transferToken(
            network,
            payment.walletAddress,
            payment.amount,
            payment.token
          );

          if (result.success) {
            // Update payment
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'COMPLETED',
                transactionHash: result.transactionHash,
                blockNumber: result.blockNumber,
                gasUsed: result.gasUsed,
                completedAt: new Date(),
              },
            });

            // Record withdrawal
            const tokenForWithdrawal = payment.token === 'ETH' ? 'native' : payment.token;
            await walletService.recordWithdrawal(
              network,
              result.transactionHash,
              payment.amount,
              tokenForWithdrawal,
              payment.walletAddress,
              'PAYMENT',
              userId,
              payment.id
            ).catch(error => {
              logger.error(`Error recording withdrawal for payment ${payment.id}:`, error);
            });

            results.push({ paymentId: payment.id, success: true, txHash: result.transactionHash });
          } else {
            // Mark payment as failed
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'FAILED',
                failureReason: result.error || 'Payment processing failed',
              },
            });
            errors.push({ paymentId: payment.id, error: result.error || 'Payment processing failed' });
          }
        } catch (error) {
          const errorMessage = error.message || error.reason || 'Payment processing error';
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              failureReason: errorMessage,
            },
          });
          errors.push({ paymentId: payment.id, error: errorMessage });
        }
      }

      // Update batch status
      const successCount = results.length;
      const failureCount = errors.length;

      if (successCount > 0 && failureCount === 0) {
        // All succeeded
        await prisma.batch.update({
          where: { id: batchId },
          data: {
            status: 'COMPLETED',
            successCount,
            failureCount: 0,
            completedAt: new Date(),
          },
        });
        logger.info(`Batch ${batchId} completed: ${successCount} payments successful`);
      } else if (successCount > 0 && failureCount > 0) {
        // Partial success
        await prisma.batch.update({
          where: { id: batchId },
          data: {
            status: 'PARTIALLY_COMPLETED',
            successCount,
            failureCount,
            completedAt: new Date(),
          },
        });
        logger.warn(`Batch ${batchId} partially completed: ${successCount} succeeded, ${failureCount} failed`);
        
        // Throw error with details
        const errorMessages = errors.map(e => `Payment ${e.paymentId}: ${e.error}`).join('; ');
        throw new Error(`Batch payment partially failed. ${errorMessages}`);
      } else {
        // All failed
        await prisma.batch.update({
          where: { id: batchId },
          data: {
            status: 'FAILED',
            successCount: 0,
            failureCount,
          },
        });
        logger.error(`Batch ${batchId} failed: all ${failureCount} payments failed`);
        
        // Throw error with details
        const errorMessages = errors.map(e => `Payment ${e.paymentId}: ${e.error}`).join('; ');
        throw new Error(`Batch payment failed. ${errorMessages}`);
      }
    } catch (error) {
      // Mark batch as failed
      await prisma.batch.update({
        where: { id: batchId },
        data: {
          status: 'FAILED',
        },
      }).catch(() => {
        // Ignore if batch doesn't exist
      });

      const errorMessage = error.message || error.reason || 'Batch processing error';
      logger.error(`Error processing batch ${batchId} on blockchain:`, errorMessage);
      
      // Re-throw with detailed message for frontend
      throw new Error(errorMessage);
    }
  }

  /**
   * Internal: Process batch on blockchain (OLD - using smart contract - deprecated)
   */
  async _processBatchOnBlockchain_OLD(batchId, employeeBlockchainIds, network, totalAmount, token, userId) {
    try {
      const result = await blockchainService.processBatchPayments(network, employeeBlockchainIds);

      const batch = await prisma.batch.findUnique({
        where: { id: batchId },
        include: { payments: true },
      });

      if (result.success) {
        // Update batch
        await prisma.batch.update({
          where: { id: batchId },
          data: {
            status: 'COMPLETED',
            transactionHash: result.transactionHash,
            completedAt: new Date(),
            successCount: batch.payments.length,
          },
        });

        // Update all payments in batch
        await prisma.payment.updateMany({
          where: { batchId },
          data: {
            status: 'COMPLETED',
            transactionHash: result.transactionHash,
            blockNumber: result.blockNumber,
            gasUsed: result.gasUsed,
            completedAt: new Date(),
          },
        });

        // Record withdrawal from company wallet for batch
        const tokenForWithdrawal = token === 'ETH' ? 'native' : token;
        // Get first payment's recipient address for batch withdrawal record
        const firstPayment = batch.payments[0];
        await walletService.recordWithdrawal(
          network,
          result.transactionHash,
          totalAmount,
          tokenForWithdrawal,
          firstPayment?.walletAddress || 'BATCH',
          'PAYMENT',
          userId,
          null,
          batchId
        ).catch(error => {
          logger.error(`Error recording withdrawal for batch ${batchId}:`, error);
        });

        logger.info(`Batch ${batchId} completed: ${result.transactionHash}`);
      } else {
        // Mark batch as failed
        await prisma.batch.update({
          where: { id: batchId },
          data: {
            status: 'FAILED',
            failureCount: batch.payments.length,
          },
        });

        // Mark all payments as failed
        await prisma.payment.updateMany({
          where: { batchId },
          data: {
            status: 'FAILED',
            failureReason: result.error || 'Batch processing failed',
          },
        });

        logger.error(`Batch ${batchId} failed: ${result.error}`);
      }
    } catch (error) {
      // Mark batch as failed
      await prisma.batch.update({
        where: { id: batchId },
        data: {
          status: 'FAILED',
        },
      });

      await prisma.payment.updateMany({
        where: { batchId },
        data: {
          status: 'FAILED',
          failureReason: error.message || 'Batch processing error',
        },
      });

      logger.error(`Error processing batch ${batchId} on blockchain:`, error);
    }
  }

  /**
   * Internal: Create notification
   */
  async _createNotification(paymentId, type) {
    try {
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: { employee: true },
      });

      if (!payment) return;

      // Find admin users to notify
      const admins = await prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'FINANCE_MANAGER'] },
          isActive: true,
        },
      });

      const notifications = admins.map(admin => ({
        userId: admin.id,
        type,
        title: type === 'PAYMENT_COMPLETED' ? 'Payment Completed' : 'Payment Failed',
        message: `Payment ${payment.id} for ${payment.employee.firstName} ${payment.employee.lastName} has ${type === 'PAYMENT_COMPLETED' ? 'completed' : 'failed'}`,
        data: {
          paymentId: payment.id,
          employeeId: payment.employeeId,
          amount: payment.amount,
          token: payment.token,
        },
      }));

      await prisma.notification.createMany({
        data: notifications,
      });
    } catch (error) {
      logger.error(`Error creating notification for payment ${paymentId}:`, error);
    }
  }

  /**
   * Update payment status from blockchain
   */
  async updatePaymentStatus(paymentId, status, transactionHash, blockNumber, gasUsed) {
    try {
      const updateData = {
        status,
        transactionHash,
        blockNumber,
        gasUsed,
      };

      if (status === 'COMPLETED' || status === 'CONFIRMED') {
        updateData.completedAt = new Date();
      }

      await prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
      });

      logger.info(`Payment ${paymentId} status updated to ${status}`);
    } catch (error) {
      logger.error(`Error updating payment status ${paymentId}:`, error);
      throw error;
    }
  }

  /**
   * Get payment statistics
   */
  async getPaymentStats() {
    try {
      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Parallel queries for all stats
      const [
        totalPayments,
        completedPayments,
        pendingPayments,
        processingPayments,
        failedPayments,
        paymentsThisMonth,
        paymentsLastMonth,
        allPayments,
      ] = await Promise.all([
        prisma.payment.count(),
        prisma.payment.count({ where: { status: 'COMPLETED' } }),
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'PROCESSING' } }),
        prisma.payment.count({ where: { status: 'FAILED' } }),
        prisma.payment.count({ 
          where: { 
            createdAt: { gte: startOfMonth } 
          } 
        }),
        prisma.payment.count({ 
          where: { 
            createdAt: { gte: lastMonth, lte: endOfLastMonth } 
          } 
        }),
        prisma.payment.findMany({
          select: {
            amount: true,
            status: true,
            createdAt: true,
            network: true,
            token: true,
          },
        }),
      ]);

      // Calculate totals
      let totalVolume = 0;
      let completedVolume = 0;
      let pendingVolume = 0;
      let failedVolume = 0;

      allPayments.forEach((payment) => {
        const amount = parseFloat(payment.amount) || 0;
        totalVolume += amount;
        
        if (payment.status === 'COMPLETED') {
          completedVolume += amount;
        } else if (payment.status === 'PENDING' || payment.status === 'PROCESSING') {
          pendingVolume += amount;
        } else if (payment.status === 'FAILED') {
          failedVolume += amount;
        }
      });

      // Calculate success rate
      const successRate = totalPayments > 0 
        ? ((completedPayments / totalPayments) * 100) 
        : 0;

      // Calculate month-over-month change
      const monthChange = paymentsLastMonth > 0
        ? ((paymentsThisMonth - paymentsLastMonth) / paymentsLastMonth) * 100
        : paymentsThisMonth > 0 ? 100 : 0;

      // Calculate average payment
      const avgPayment = completedPayments > 0
        ? completedVolume / completedPayments
        : 0;

      return {
        totalPayments,
        totalVolume: totalVolume.toString(),
        completedPayments,
        completedVolume: completedVolume.toString(),
        pendingPayments: pendingPayments + processingPayments,
        pendingVolume: pendingVolume.toString(),
        failedPayments,
        failedVolume: failedVolume.toString(),
        paymentsThisMonth,
        paymentsLastMonth,
        monthChange: monthChange.toFixed(1),
        avgPayment: avgPayment.toFixed(2),
        successRate: successRate.toFixed(1),
      };
    } catch (error) {
      logger.error('Error getting payment stats:', error);
      throw error;
    }
  }

  /**
   * Get payroll statistics (combines employee and payment data)
   */
  async getPayrollStats() {
    try {
      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Parallel queries for all stats
      const [
        totalEmployees,
        activeEmployees,
        completedPayments,
        pendingPayments,
        processingPayments,
        allPayments,
      ] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { status: 'ACTIVE' } }),
        prisma.payment.count({ where: { status: 'COMPLETED' } }),
        prisma.payment.count({ where: { status: 'PENDING' } }),
        prisma.payment.count({ where: { status: 'PROCESSING' } }),
        prisma.payment.findMany({
          where: { status: 'COMPLETED' },
          select: {
            amount: true,
            createdAt: true,
          },
        }),
      ]);

      // Calculate monthly payroll (completed payments this month)
      const monthlyPayroll = allPayments
        .filter(p => new Date(p.createdAt) >= startOfMonth)
        .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Calculate total payroll (all completed payments)
      const totalPayroll = allPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      // Calculate pending amount
      const pendingPaymentsData = await prisma.payment.findMany({
        where: { 
          status: { in: ['PENDING', 'PROCESSING'] }
        },
        select: {
          amount: true,
        },
      });
      const pendingAmount = pendingPaymentsData.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

      return {
        totalEmployees,
        activeEmployees,
        monthlyPayroll: monthlyPayroll.toString(),
        totalPayroll: totalPayroll.toString(),
        pendingPayments: pendingPayments + processingPayments,
        pendingAmount: pendingAmount.toString(),
        completedPayments,
      };
    } catch (error) {
      logger.error('Error getting payroll stats:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();

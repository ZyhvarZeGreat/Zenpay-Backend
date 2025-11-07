const walletService = require('../services/walletService');
const logger = require('../utils/logger');

class WalletController {
  /**
   * Get wallet balance for a specific token
   * GET /api/v1/wallets/:network/balance
   */
  async getWalletBalance(req, res, next) {
    try {
      const { network } = req.params;
      const { token } = req.query;

      const balance = await walletService.getWalletBalance(network, token || 'native');

      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      logger.error('Error getting wallet balance:', error);
      next(error);
    }
  }

  /**
   * Get all wallet balances for a network
   * GET /api/v1/wallets/:network/balances
   */
  async getAllWalletBalances(req, res, next) {
    try {
      const { network } = req.params;

      const balances = await walletService.getAllWalletBalances(network);

      res.json({
        success: true,
        data: balances,
      });
    } catch (error) {
      logger.error('Error getting wallet balances:', error);
      next(error);
    }
  }

  /**
   * Get wallet summary
   * GET /api/v1/wallets/:network/summary
   */
  async getWalletSummary(req, res, next) {
    try {
      const { network } = req.params;

      const summary = await walletService.getWalletSummary(network);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      logger.error('Error getting wallet summary:', error);
      next(error);
    }
  }

  /**
   * Record deposit
   * POST /api/v1/wallets/:network/deposits
   */
  async recordDeposit(req, res, next) {
    try {
      const { network } = req.params;
      const { transactionHash, amount, token } = req.body;

      if (!transactionHash || !amount || !token) {
        return res.status(400).json({
          success: false,
          error: 'Transaction hash, amount, and token are required',
        });
      }

      const deposit = await walletService.recordDeposit(
        network,
        transactionHash,
        amount,
        token,
        req.user.id
      );

      res.status(201).json({
        success: true,
        message: 'Deposit recorded successfully',
        data: deposit,
      });
    } catch (error) {
      logger.error('Error recording deposit:', error);
      next(error);
    }
  }

  /**
   * Get deposit history
   * GET /api/v1/wallets/:network/deposits
   */
  async getDepositHistory(req, res, next) {
    try {
      const { network } = req.params;
      const { page, limit, startDate, endDate } = req.query;

      const result = await walletService.getDepositHistory(network, {
        page,
        limit,
        startDate,
        endDate,
      });

      res.json({
        success: true,
        data: result.deposits,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error getting deposit history:', error);
      next(error);
    }
  }

  /**
   * Get withdrawal history
   * GET /api/v1/wallets/:network/withdrawals
   */
  async getWithdrawalHistory(req, res, next) {
    try {
      const { network } = req.params;
      const { page, limit, startDate, endDate, withdrawalType } = req.query;

      const result = await walletService.getWithdrawalHistory(network, {
        page,
        limit,
        startDate,
        endDate,
        withdrawalType,
      });

      res.json({
        success: true,
        data: result.withdrawals,
        pagination: result.pagination,
      });
    } catch (error) {
      logger.error('Error getting withdrawal history:', error);
      next(error);
    }
  }
}

module.exports = new WalletController();


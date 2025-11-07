const blockchainService = require('./blockchainService');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const { getContract } = require('../config/blockchain');

class WalletService {
  /**
   * Get or create company wallet for network
   */
  async getOrCreateWallet(network) {
    try {
      let wallet = await prisma.companyWallet.findUnique({
        where: { network },
      });

      // Determine the expected wallet address
      let expectedWalletAddress;
      if (network === 'ETHEREUM') {
        // Use the company wallet address for Ethereum/Sepolia
        expectedWalletAddress = process.env.COMPANY_WALLET_ADDRESS || '0x99dFacb767d4010Aa9d493583D5d243ABf9C88A7';
      } else {
        // For other networks, use contract address as fallback
        const { NETWORKS } = require('../config/blockchain');
        const networkConfig = NETWORKS[network];
        if (!networkConfig) {
          throw new Error(`Network configuration not found for ${network}`);
        }
        expectedWalletAddress = networkConfig.contracts.corePayroll;
        if (!expectedWalletAddress) {
          throw new Error(`CorePayroll contract address not found for ${network}`);
        }
      }

      if (!wallet) {
        // Create new wallet
        wallet = await prisma.companyWallet.create({
          data: {
            network,
            walletAddress: expectedWalletAddress,
          },
        });

        logger.info(`Company wallet created for ${network}: ${expectedWalletAddress}`);
      } else if (wallet.walletAddress.toLowerCase() !== expectedWalletAddress.toLowerCase()) {
        // Update existing wallet if address is different
        wallet = await prisma.companyWallet.update({
          where: { network },
          data: {
            walletAddress: expectedWalletAddress,
          },
        });

        logger.info(`Company wallet updated for ${network}: ${expectedWalletAddress}`);
      }

      return wallet;
    } catch (error) {
      logger.error(`Error getting/creating wallet for ${network}:`, error);
      throw error;
    }
  }

  /**
   * Get wallet balance for a specific token
   */
  async getWalletBalance(network, token = 'native') {
    try {
      const wallet = await this.getOrCreateWallet(network);

      // Get balance from blockchain using the company wallet address
      let balance = '0';
      if (token === 'native' || token === 'ETH') {
        // Get native balance
        const { getProvider } = require('../config/blockchain');
        const provider = getProvider(network);
        balance = (await provider.getBalance(wallet.walletAddress)).toString();
      } else {
        // Get ERC20 token balance directly from the wallet address
        balance = await blockchainService.getTokenBalance(network, wallet.walletAddress, token);
      }

      // Update or create balance record
      const balanceRecord = await prisma.walletBalance.upsert({
        where: {
          walletId_token_network: {
            walletId: wallet.id,
            token,
            network,
          },
        },
        update: {
          balance,
          lastUpdated: new Date(),
        },
        create: {
          walletId: wallet.id,
          token,
          balance,
          network,
        },
      });

      return {
        walletId: wallet.id,
        walletAddress: wallet.walletAddress,
        network,
        token,
        balance,
        lastUpdated: balanceRecord.lastUpdated,
      };
    } catch (error) {
      logger.error(`Error getting wallet balance for ${network}/${token}:`, error);
      throw error;
    }
  }

  /**
   * Get all wallet balances for a network
   */
  async getAllWalletBalances(network) {
    try {
      const wallet = await this.getOrCreateWallet(network);

      // Get native balance
      const nativeBalance = await this.getWalletBalance(network, 'native');

      // Get all tracked token balances
      const tokenBalances = await prisma.walletBalance.findMany({
        where: {
          walletId: wallet.id,
          network,
          token: { not: 'native' },
        },
      });

      // Refresh balances from blockchain
      const refreshedBalances = await Promise.all(
        tokenBalances.map(async (tb) => {
          try {
            return await this.getWalletBalance(network, tb.token);
          } catch (error) {
            logger.error(`Error refreshing balance for ${tb.token}:`, error);
            return tb;
          }
        })
      );

      return {
        wallet: {
          id: wallet.id,
          address: wallet.walletAddress,
          network: wallet.network,
        },
        balances: [nativeBalance, ...refreshedBalances],
      };
    } catch (error) {
      logger.error(`Error getting all wallet balances for ${network}:`, error);
      throw error;
    }
  }

  /**
   * Check if wallet has sufficient balance
   */
  async hasSufficientBalance(network, token, amount) {
    try {
      const balance = await this.getWalletBalance(network, token);
      const balanceAmount = parseFloat(balance.balance);
      const requiredAmount = parseFloat(amount);

      return balanceAmount >= requiredAmount;
    } catch (error) {
      logger.error(`Error checking balance for ${network}/${token}:`, error);
      return false;
    }
  }

  /**
   * Record deposit to wallet
   */
  async recordDeposit(network, transactionHash, amount, token, depositedBy) {
    try {
      const wallet = await this.getOrCreateWallet(network);

      const deposit = await prisma.walletDeposit.create({
        data: {
          walletId: wallet.id,
          transactionHash,
          amount,
          token,
          network,
          depositedBy,
          confirmedAt: new Date(),
        },
      });

      // Update balance
      await this.getWalletBalance(network, token);

      logger.info(`Deposit recorded: ${deposit.id} for ${amount} ${token} on ${network}`);
      return deposit;
    } catch (error) {
      logger.error(`Error recording deposit:`, error);
      throw error;
    }
  }

  /**
   * Record withdrawal from wallet
   */
  async recordWithdrawal(network, transactionHash, amount, token, recipientAddress, withdrawalType, withdrawnBy, paymentId = null, batchId = null) {
    try {
      const wallet = await this.getOrCreateWallet(network);

      const withdrawal = await prisma.walletWithdrawal.create({
        data: {
          walletId: wallet.id,
          paymentId,
          batchId,
          transactionHash,
          amount,
          token,
          network,
          withdrawalType,
          recipientAddress,
          withdrawnBy,
          confirmedAt: new Date(),
        },
      });

      // Update balance
      await this.getWalletBalance(network, token);

      logger.info(`Withdrawal recorded: ${withdrawal.id} for ${amount} ${token} on ${network}`);
      return withdrawal;
    } catch (error) {
      logger.error(`Error recording withdrawal:`, error);
      throw error;
    }
  }

  /**
   * Get deposit history
   */
  async getDepositHistory(network, { page = 1, limit = 20, startDate, endDate }) {
    try {
      const wallet = await this.getOrCreateWallet(network);
      const skip = (page - 1) * limit;

      const where = { walletId: wallet.id };
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [deposits, total] = await Promise.all([
        prisma.walletDeposit.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.walletDeposit.count({ where }),
      ]);

      return {
        deposits,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error getting deposit history:`, error);
      throw error;
    }
  }

  /**
   * Get withdrawal history
   */
  async getWithdrawalHistory(network, { page = 1, limit = 20, startDate, endDate, withdrawalType }) {
    try {
      const wallet = await this.getOrCreateWallet(network);
      const skip = (page - 1) * limit;

      const where = { walletId: wallet.id };
      if (withdrawalType) {
        where.withdrawalType = withdrawalType;
      }
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [withdrawals, total] = await Promise.all([
        prisma.walletWithdrawal.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.walletWithdrawal.count({ where }),
      ]);

      return {
        withdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error getting withdrawal history:`, error);
      throw error;
    }
  }

  /**
   * Get wallet summary
   */
  async getWalletSummary(network) {
    try {
      const wallet = await this.getOrCreateWallet(network);
      const balances = await this.getAllWalletBalances(network);

      // Get recent deposits and withdrawals
      const [recentDeposits, recentWithdrawals] = await Promise.all([
        prisma.walletDeposit.findMany({
          where: { walletId: wallet.id },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.walletWithdrawal.findMany({
          where: { walletId: wallet.id },
          take: 10,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        wallet: {
          id: wallet.id,
          address: wallet.walletAddress,
          network: wallet.network,
          isActive: wallet.isActive,
        },
        balances: balances.balances,
        recentDeposits,
        recentWithdrawals,
      };
    } catch (error) {
      logger.error(`Error getting wallet summary:`, error);
      throw error;
    }
  }
}

module.exports = new WalletService();


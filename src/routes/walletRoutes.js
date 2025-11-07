const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/wallets/{network}/balance:
 *   get:
 *     summary: Get wallet balance for a token
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet balance
 */
router.get(
  '/:network/balance',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  walletController.getWalletBalance.bind(walletController)
);

/**
 * @swagger
 * /api/v1/wallets/{network}/balances:
 *   get:
 *     summary: Get all wallet balances for a network
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: All wallet balances
 */
router.get(
  '/:network/balances',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  walletController.getAllWalletBalances.bind(walletController)
);

/**
 * @swagger
 * /api/v1/wallets/{network}/summary:
 *   get:
 *     summary: Get wallet summary
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Wallet summary
 */
router.get(
  '/:network/summary',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  walletController.getWalletSummary.bind(walletController)
);

/**
 * @swagger
 * /api/v1/wallets/{network}/deposits:
 *   post:
 *     summary: Record deposit to wallet
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionHash
 *               - amount
 *               - token
 *             properties:
 *               transactionHash:
 *                 type: string
 *               amount:
 *                 type: string
 *               token:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deposit recorded
 */
router.post(
  '/:network/deposits',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  walletController.recordDeposit.bind(walletController)
);

/**
 * @swagger
 * /api/v1/wallets/{network}/deposits:
 *   get:
 *     summary: Get deposit history
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Deposit history
 */
router.get(
  '/:network/deposits',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  walletController.getDepositHistory.bind(walletController)
);

/**
 * @swagger
 * /api/v1/wallets/{network}/withdrawals:
 *   get:
 *     summary: Get withdrawal history
 *     tags: [Wallets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: network
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: withdrawalType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Withdrawal history
 */
router.get(
  '/:network/withdrawals',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  walletController.getWithdrawalHistory.bind(walletController)
);

module.exports = router;


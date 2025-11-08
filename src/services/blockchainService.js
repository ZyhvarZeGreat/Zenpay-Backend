const { getContract, estimateGas, waitForConfirmation, parseEvents } = require('../config/blockchain');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class BlockchainService {
  /**
   * Direct USDT transfer to recipient address
   * @param {string} network - Network name
   * @param {string} recipientAddress - Recipient wallet address
   * @param {string} amount - Amount to transfer (in token units, e.g., "1" for 1 USDT)
   * @param {string} token - Token symbol (USDT, USDC, etc.)
   * @param {number} maxRetries - Maximum retry attempts
   */
  async transferToken(network, recipientAddress, amount, token = 'USDT', maxRetries = 3) {
    let attempts = 0;
    let lastError;

    while (attempts < maxRetries) {
      try {
        attempts++;
        logger.info(`Transferring ${amount} ${token} to ${recipientAddress} on ${network} (attempt ${attempts})`);

        const { getProvider, getWallet } = require('../config/blockchain');
        const { ethers } = require('ethers');
        const provider = getProvider(network);
        const wallet = getWallet(network);

        // Get token address
        const tokenAddress = this.getTokenAddress(network, token);

        // ERC20 ABI for transfer
        const erc20Abi = [
          'function transfer(address to, uint256 amount) external returns (bool)',
          'function decimals() external view returns (uint8)',
          'function balanceOf(address account) external view returns (uint256)',
        ];

        const tokenContract = new ethers.Contract(tokenAddress, erc20Abi, wallet);

        // Get decimals
        const decimals = await tokenContract.decimals();
        const amountInWei = ethers.parseUnits(amount.toString(), decimals);

        // Check balance before transfer
        const balance = await tokenContract.balanceOf(wallet.address);
        if (balance < amountInWei) {
          const balanceFormatted = ethers.formatUnits(balance, decimals);
          throw new Error(`Insufficient ${token} balance. Required: ${amount} ${token}, Available: ${balanceFormatted} ${token}`);
        }

        // Estimate gas
        const gasEstimate = await tokenContract.transfer.estimateGas(recipientAddress, amountInWei);
        const gasPrice = await provider.getFeeData();
        const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // 20% buffer

        // Send transaction
        const tx = await tokenContract.transfer(recipientAddress, amountInWei, {
          gasLimit: gasLimit.toString(),
          maxFeePerGas: gasPrice.maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
        });

        logger.info(`Token transfer transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await tx.wait();

        if (receipt.status === 1) {
          logger.info(`Token transfer successful: ${tx.hash}`);
          return {
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
          };
        } else {
          throw new Error('Transaction failed on blockchain');
        }
      } catch (error) {
        lastError = error;
        const errorMessage = error.reason || error.message || 'Unknown error';
        logger.error(`Token transfer attempt ${attempts} failed:`, errorMessage);

        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts)); // Exponential backoff
        }
      }
    }

    const errorMessage = lastError?.reason || lastError?.message || 'Token transfer failed after maximum retries';
    return {
      success: false,
      error: errorMessage,
    };
  }

  /**
   * Process single salary payment (using direct transfer)
   * @deprecated Use transferToken directly instead
   */
  async processSalaryPayment(network, recipientAddress, amount, token, maxRetries = 3) {
    // Delegate to transferToken method
    return await this.transferToken(network, recipientAddress, amount, token, maxRetries);
  }

  /**
   * Process batch salary payments
   */
  async processBatchPayments(network, employeeIds, maxRetries = 3) {
    let attempts = 0;
    let lastError;

    while (attempts < maxRetries) {
      try {
        attempts++;
        logger.info(`Processing batch payment for ${employeeIds.length} employees on ${network} (attempt ${attempts})`);

        const contract = getContract(network, 'corePayroll');
        
        // Estimate gas
        const gasParams = await estimateGas(network, {
          to: await contract.getAddress(),
          data: contract.interface.encodeFunctionData('processBatchSalaryPayments', [employeeIds]),
        });

        // Send transaction
        const tx = await contract.processBatchSalaryPayments(employeeIds, {
          gasLimit: gasParams.gasLimit,
        });

        logger.info(`Batch transaction sent: ${tx.hash}`);

        // Wait for confirmation
        const receipt = await waitForConfirmation(network, tx.hash);

        if (receipt.status === 1) {
          logger.info(`Batch payment successful: ${tx.hash}`);
          return {
            success: true,
            transactionHash: tx.hash,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            events: parseEvents(contract, receipt),
          };
        } else {
          throw new Error('Transaction failed');
        }
      } catch (error) {
        lastError = error;
        logger.error(`Batch payment attempt ${attempts} failed:`, error.message);

        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000 * attempts));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Batch payment failed after maximum retries',
    };
  }

  /**
   * Add employee to blockchain
   */
  async addEmployee(network, employeeData) {
    try {
      const contract = getContract(network, 'employeeRegistry');
      
      const tx = await contract.addEmployee(
        employeeData.walletAddress,
        employeeData.department,
        employeeData.role,
        employeeData.salaryAmount,
        employeeData.salaryToken,
        employeeData.paymentFrequency
      );

      const receipt = await waitForConfirmation(network, tx.hash);

      return {
        success: receipt.status === 1,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Add employee failed:', error.message);
      throw error;
    }
  }

  /**
   * Create invoice on blockchain
   */
  async createInvoice(network, invoiceData) {
    try {
      const contract = getContract(network, 'invoiceManager');
      
      const tx = await contract.createInvoice(
        invoiceData.employeeId,
        invoiceData.employeeWallet,
        invoiceData.amount,
        invoiceData.token,
        invoiceData.dueDate,
        invoiceData.description
      );

      const receipt = await waitForConfirmation(network, tx.hash);

      return {
        success: receipt.status === 1,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Create invoice failed:', error.message);
      throw error;
    }
  }

  /**
   * Create payment approval request
   */
  async createPaymentRequest(network, requestData) {
    try {
      const contract = getContract(network, 'paymentApproval');
      
      const tx = await contract.createPaymentRequest(
        requestData.employeeIds,
        requestData.walletAddresses,
        requestData.amounts,
        requestData.token,
        requestData.reason
      );

      const receipt = await waitForConfirmation(network, tx.hash);

      return {
        success: receipt.status === 1,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        events: parseEvents(contract, receipt),
      };
    } catch (error) {
      logger.error('Create payment request failed:', error.message);
      throw error;
    }
  }

  /**
   * Approve payment request
   */
  async approvePaymentRequest(network, requestId, comments) {
    try {
      const contract = getContract(network, 'paymentApproval');
      
      const tx = await contract.approvePaymentRequest(requestId, comments);
      const receipt = await waitForConfirmation(network, tx.hash);

      return {
        success: receipt.status === 1,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error) {
      logger.error('Approve payment request failed:', error.message);
      throw error;
    }
  }

  /**
   * Get token balance for a specific wallet address
   * @param {string} network - Network name
   * @param {string} walletAddress - Wallet address to check balance for
   * @param {string} token - Token symbol or address
   */
  async getTokenBalance(network, walletAddress, token) {
    try {
      const { getProvider } = require('../config/blockchain');
      const provider = getProvider(network);
      
      // Map token symbols to addresses
      const tokenAddress = this.getTokenAddress(network, token);
      
      // Log the token address being used for debugging
      if (network === 'ETHEREUM' && token === 'USDT') {
        logger.info(`Querying USDT balance using contract address: ${tokenAddress} for wallet: ${walletAddress}`);
      }
      
      if (tokenAddress === '0x0000000000000000000000000000000000000000' || token === 'native' || token === 'ETH') {
        // Native balance
        const balance = await provider.getBalance(walletAddress);
        return balance.toString();
      } else {
        // ERC20 token balance
        const erc20Abi = [
          'function balanceOf(address owner) view returns (uint256)',
          'function decimals() view returns (uint8)',
        ];
        const tokenContract = new (require('ethers')).Contract(tokenAddress, erc20Abi, provider);
        const balance = await tokenContract.balanceOf(walletAddress);
        return balance.toString();
      }
    } catch (error) {
      logger.error('Get token balance failed:', error.message);
      throw error;
    }
  }

  /**
   * @deprecated Use getTokenBalance instead. This method checks balance through the contract.
   */
  async getContractBalance(network, token) {
    try {
      const contract = getContract(network, 'corePayroll');
      
      // Map token symbols to addresses for Sepolia/Ethereum
      const tokenAddress = this.getTokenAddress(network, token);
      
      const balance = await contract.getBalance(tokenAddress);
      return balance.toString();
    } catch (error) {
      logger.error('Get contract balance failed:', error.message);
      throw error;
    }
  }

  /**
   * Get token address from symbol or return address if already provided
   * @param {string} network - Network name
   * @param {string} token - Token symbol or address
   */
  getTokenAddress(network, token) {
    // If it's already an address (starts with 0x and 42 chars), return it
    if (token && token.startsWith('0x') && token.length === 42) {
      return token;
    }

    // Token address mappings for different networks
    const tokenMappings = {
      ETHEREUM: {
        // Sepolia testnet token addresses
        'USDT': '0x2Cf09c9DdF37F09eA9AD9897894fe59114f6E43e', // Official Sepolia USDT (6 decimals)
        'USDC': '0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8', // Sepolia USDC (test token)
        'DAI': '0x3e622317f8C93f7328350cF0b56E9b2d5C0C1b2E', // Sepolia DAI (test token)
        'ETH': '0x0000000000000000000000000000000000000000', // Native ETH
        'native': '0x0000000000000000000000000000000000000000', // Native ETH
      },
      POLYGON: {
        'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
        'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        'DAI': '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
      },
      BSC: {
        'USDT': '0x55d398326f99059fF775485246999027B3197955',
        'USDC': '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        'DAI': '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3',
      },
    };

    const networkMapping = tokenMappings[network];
    if (!networkMapping) {
      throw new Error(`Network ${network} not supported`);
    }

    const address = networkMapping[token.toUpperCase()];
    if (!address) {
      throw new Error(`Token ${token} not found for network ${network}. Please provide token address.`);
    }

    return address;
  }
}

module.exports = new BlockchainService();


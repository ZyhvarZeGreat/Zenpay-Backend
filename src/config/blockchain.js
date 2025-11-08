const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Smart Contract ABIs (import from artifacts)
// Path is relative to src/config/blockchain.js -> ../artifacts/ (in backend folder)
const employeeRegistryABI = require('../../artifacts/contracts/EmployeeRegistry.sol/EmployeeRegistry.json').abi;
const invoiceManagerABI = require('../../artifacts/contracts/InvoiceManager.sol/InvoiceManager.json').abi;
const paymentApprovalABI = require('../../artifacts/contracts/PaymentApproval.sol/PaymentApproval.json').abi;
const corePayrollABI = require('../../artifacts/contracts/CorePayroll.sol/CorePayroll.json').abi;

// Network configurations
const NETWORKS = {
  ETHEREUM: {
    name: 'ethereum',
    chainId: parseInt(process.env.ETHEREUM_CHAIN_ID || '1'),
    rpcUrl: process.env.ETHEREUM_RPC_URL,
    mnemonic: process.env.MNEMONIC,
    contracts: {
      employeeRegistry: process.env.ETH_EMPLOYEE_REGISTRY,
      invoiceManager: process.env.ETH_INVOICE_MANAGER,
      paymentApproval: process.env.ETH_PAYMENT_APPROVAL,
      corePayroll: process.env.ETH_CORE_PAYROLL,
    },
  },
  POLYGON: {
    name: 'polygon',
    chainId: parseInt(process.env.POLYGON_CHAIN_ID || '137'),
    rpcUrl: process.env.POLYGON_RPC_URL,
    mnemonic: process.env.MNEMONIC,
    contracts: {
      employeeRegistry: process.env.POLYGON_EMPLOYEE_REGISTRY,
      invoiceManager: process.env.POLYGON_INVOICE_MANAGER,
      paymentApproval: process.env.POLYGON_PAYMENT_APPROVAL,
      corePayroll: process.env.POLYGON_CORE_PAYROLL,
    },
  },
  BSC: {
    name: 'bsc',
    chainId: parseInt(process.env.BSC_CHAIN_ID || '56'),
    rpcUrl: process.env.BSC_RPC_URL,
    mnemonic: process.env.MNEMONIC,
    contracts: {
      employeeRegistry: process.env.BSC_EMPLOYEE_REGISTRY,
      invoiceManager: process.env.BSC_INVOICE_MANAGER,
      paymentApproval: process.env.BSC_PAYMENT_APPROVAL,
      corePayroll: process.env.BSC_CORE_PAYROLL,
    },
  },
};

// Provider instances cache
const providers = {};
const wallets = {};
const contracts = {};

/**
 * Get Web3 provider for a specific network
 */
function getProvider(network) {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }

  if (!providers[network]) {
    providers[network] = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    logger.info(`✓ Provider initialized for ${network}`);
  }

  return providers[network];
}

/**
 * Get wallet for a specific network
 * Uses SENDER_PRIVATE_KEY if available, otherwise falls back to mnemonic
 */
function getWallet(network) {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }

  if (!wallets[network]) {
    const provider = getProvider(network);
    
    // Priority: Use SENDER_PRIVATE_KEY if available, otherwise use mnemonic
    if (process.env.SENDER_PRIVATE_KEY) {
      wallets[network] = new ethers.Wallet(process.env.SENDER_PRIVATE_KEY, provider);
      logger.info(`✓ Wallet initialized for ${network} (from SENDER_PRIVATE_KEY): ${wallets[network].address}`);
    } else if (networkConfig.mnemonic) {
      wallets[network] = ethers.Wallet.fromPhrase(networkConfig.mnemonic).connect(provider);
      logger.info(`✓ Wallet initialized for ${network} (from mnemonic): ${wallets[network].address}`);
    } else {
      throw new Error(`Neither SENDER_PRIVATE_KEY nor mnemonic configured for ${network}`);
    }
  }

  return wallets[network];
}

/**
 * Get contract instance
 */
function getContract(network, contractName) {
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }

  const key = `${network}_${contractName}`;
  
  if (!contracts[key]) {
    const wallet = getWallet(network);
    const contractAddress = networkConfig.contracts[contractName];
    
    if (!contractAddress) {
      throw new Error(`Contract ${contractName} not configured for ${network}`);
    }

    let abi;
    switch (contractName) {
      case 'employeeRegistry':
        abi = employeeRegistryABI;
        break;
      case 'invoiceManager':
        abi = invoiceManagerABI;
        break;
      case 'paymentApproval':
        abi = paymentApprovalABI;
        break;
      case 'corePayroll':
        abi = corePayrollABI;
        break;
      default:
        throw new Error(`Unknown contract: ${contractName}`);
    }

    contracts[key] = new ethers.Contract(contractAddress, abi, wallet);
    logger.info(`✓ Contract ${contractName} initialized for ${network}`);
  }

  return contracts[key];
}

/**
 * Estimate gas for a transaction
 */
async function estimateGas(network, transaction) {
  try {
    const provider = getProvider(network);
    const gasEstimate = await provider.estimateGas(transaction);
    const gasPrice = await provider.getFeeData();
    
    // Add buffer to gas estimate
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100); // 20% buffer
    
    return {
      gasLimit: gasLimit.toString(),
      maxFeePerGas: gasPrice.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas?.toString(),
      gasPrice: gasPrice.gasPrice?.toString(),
    };
  } catch (error) {
    logger.error(`Gas estimation failed for ${network}:`, error.message);
    throw error;
  }
}

/**
 * Wait for transaction confirmation
 */
async function waitForConfirmation(network, txHash, confirmations = 3) {
  try {
    const provider = getProvider(network);
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    return receipt;
  } catch (error) {
    logger.error(`Transaction confirmation failed: ${txHash}`, error.message);
    throw error;
  }
}

/**
 * Get current block number
 */
async function getCurrentBlock(network) {
  const provider = getProvider(network);
  return await provider.getBlockNumber();
}

/**
 * Get transaction receipt
 */
async function getTransactionReceipt(network, txHash) {
  const provider = getProvider(network);
  return await provider.getTransactionReceipt(txHash);
}

/**
 * Check if transaction is confirmed
 */
async function isTransactionConfirmed(network, txHash, requiredConfirmations = 3) {
  try {
    const provider = getProvider(network);
    const receipt = await getTransactionReceipt(network, txHash);
    
    if (!receipt) {
      return { confirmed: false, confirmations: 0 };
    }

    const currentBlock = await getCurrentBlock(network);
    const confirmations = currentBlock - receipt.blockNumber + 1;

    return {
      confirmed: confirmations >= requiredConfirmations,
      confirmations,
      blockNumber: receipt.blockNumber,
      status: receipt.status === 1 ? 'success' : 'failed',
    };
  } catch (error) {
    logger.error(`Error checking transaction confirmation: ${txHash}`, error.message);
    return { confirmed: false, confirmations: 0, error: error.message };
  }
}

/**
 * Parse contract events from receipt
 */
function parseEvents(contract, receipt) {
  const events = [];
  
  for (const log of receipt.logs) {
    try {
      const parsedLog = contract.interface.parseLog(log);
      if (parsedLog) {
        events.push({
          name: parsedLog.name,
          args: parsedLog.args,
          signature: parsedLog.signature,
        });
      }
    } catch (e) {
      // Not an event from this contract
      continue;
    }
  }

  return events;
}

/**
 * Get wallet address for a specific network
 * This is the address that needs to have FINANCE_MANAGER_ROLE in the smart contract
 */
function getWalletAddress(network) {
  const wallet = getWallet(network);
  return wallet.address;
}

module.exports = {
  NETWORKS,
  getProvider,
  getWallet,
  getWalletAddress,
  getContract,
  estimateGas,
  waitForConfirmation,
  getCurrentBlock,
  getTransactionReceipt,
  isTransactionConfirmed,
  parseEvents,
};


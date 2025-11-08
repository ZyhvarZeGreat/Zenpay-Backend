/**
 * Test script to send 1 USDT to a specific address
 */

require('dotenv').config();
const { ethers } = require('ethers');
const { getProvider, getWallet } = require('../src/config/blockchain');
const logger = require('../src/utils/logger');

// USDT contract address on Sepolia
const SEPOLIA_USDT_ADDRESS = '0x2Cf09c9DdF37F09eA9AD9897894fe59114f6E43e';

// USDT ABI (minimal - just what we need)
const USDT_ABI = [
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)"
];

async function testUsdtTransfer() {
  try {
    const network = 'ETHEREUM';
    const recipientAddress = '0xcc7b3fc3ad0e06f956ab29ce1c94213a4abfdc8f';
    const amount = 1; // 1 USDT

    console.log('\n=== USDT Transfer Test ===\n');
    console.log(`Network: ${network}`);
    console.log(`Recipient: ${recipientAddress}`);
    console.log(`Amount: ${amount} USDT\n`);

    // Get wallet and provider
    const wallet = getWallet(network);
    const provider = getProvider(network);

    console.log(`Sender Address: ${wallet.address}`);
    console.log(`USDT Contract: ${SEPOLIA_USDT_ADDRESS}\n`);

    // Create USDT contract instance
    const usdtContract = new ethers.Contract(SEPOLIA_USDT_ADDRESS, USDT_ABI, wallet);

    // Get decimals (USDT on Sepolia uses 18 decimals)
    const decimals = await usdtContract.decimals();
    console.log(`USDT Decimals: ${decimals}`);

    // Convert amount to wei (with decimals)
    const amountInWei = ethers.parseUnits(amount.toString(), decimals);
    console.log(`Amount in Wei: ${amountInWei.toString()}\n`);

    // Check sender balance
    const senderBalance = await usdtContract.balanceOf(wallet.address);
    const senderBalanceFormatted = ethers.formatUnits(senderBalance, decimals);
    console.log(`Sender USDT Balance: ${senderBalanceFormatted} USDT`);

    if (senderBalance < amountInWei) {
      console.error(`\n❌ Insufficient balance! Need ${amount} USDT but have ${senderBalanceFormatted} USDT`);
      return;
    }

    // Check recipient balance before
    const recipientBalanceBefore = await usdtContract.balanceOf(recipientAddress);
    const recipientBalanceBeforeFormatted = ethers.formatUnits(recipientBalanceBefore, decimals);
    console.log(`Recipient USDT Balance (before): ${recipientBalanceBeforeFormatted} USDT\n`);

    // Send transaction
    console.log('Sending transaction...');
    const tx = await usdtContract.transfer(recipientAddress, amountInWei);
    console.log(`Transaction Hash: ${tx.hash}`);
    console.log('Waiting for confirmation...\n');

    // Wait for confirmation
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('✅ Transaction successful!');
      console.log(`Block Number: ${receipt.blockNumber}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}\n`);

      // Check recipient balance after
      const recipientBalanceAfter = await usdtContract.balanceOf(recipientAddress);
      const recipientBalanceAfterFormatted = ethers.formatUnits(recipientBalanceAfter, decimals);
      console.log(`Recipient USDT Balance (after): ${recipientBalanceAfterFormatted} USDT`);
      console.log(`Amount Received: ${(parseFloat(recipientBalanceAfterFormatted) - parseFloat(recipientBalanceBeforeFormatted)).toFixed(6)} USDT\n`);

      console.log(`View on Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
    } else {
      console.error('❌ Transaction failed!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.reason) {
      console.error('Reason:', error.reason);
    }
    if (error.data) {
      console.error('Data:', error.data);
    }
    process.exit(1);
  }
}

// Run the test
testUsdtTransfer()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });


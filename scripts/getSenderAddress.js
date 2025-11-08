/**
 * Script to get the sender wallet address for each network
 * This address needs to have FINANCE_MANAGER_ROLE in the CorePayroll contract
 */

require('dotenv').config();
const { getWalletAddress, NETWORKS } = require('../src/config/blockchain');

console.log('\n=== Sender Wallet Addresses ===\n');
if (process.env.SENDER_PRIVATE_KEY) {
  console.log('Using SENDER_PRIVATE_KEY from environment.');
} else {
  console.log('Using MNEMONIC from environment (derived address).');
}
console.log('These addresses MUST have FINANCE_MANAGER_ROLE in the CorePayroll contract.\n');

Object.keys(NETWORKS).forEach(network => {
  try {
    const address = getWalletAddress(network);
    console.log(`${network}:`);
    console.log(`  Address: ${address}`);
    console.log(`  Network: ${NETWORKS[network].name}`);
    console.log(`  Chain ID: ${NETWORKS[network].chainId}`);
    console.log(`  CorePayroll Contract: ${NETWORKS[network].contracts.corePayroll || 'Not configured'}`);
    console.log('');
  } catch (error) {
    console.error(`${network}: Error - ${error.message}`);
    console.log('');
  }
});

console.log('\n=== Role Requirements ===');
console.log('The sender address needs FINANCE_MANAGER_ROLE to call:');
console.log('  - processSalaryPayment()');
console.log('  - processBatchSalaryPayments()');
console.log('  - depositETH()');
console.log('  - depositTokens()');
console.log('\nTo grant the role, call on the CorePayroll contract:');
console.log('  grantRole(FINANCE_MANAGER_ROLE, <sender_address>)');
console.log('\nOnly OWNER_ROLE or ADMIN_ROLE can grant roles.\n');

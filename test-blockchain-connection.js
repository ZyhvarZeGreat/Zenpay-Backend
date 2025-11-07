// Test blockchain connection and contract interaction
require('dotenv').config();
const { ethers } = require('ethers');

// Import ABIs
const employeeRegistryABI = require('../artifacts/contracts/EmployeeRegistry.sol/EmployeeRegistry.json').abi;
const corePayrollABI = require('../artifacts/contracts/CorePayroll.sol/CorePayroll.json').abi;

async function testBlockchainConnection() {
  console.log('🧪 Testing Blockchain Integration with Sepolia\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // 1. Test RPC Connection
    console.log('Step 1: Testing RPC Connection...');
    const provider = new ethers.JsonRpcProvider(process.env.ETHEREUM_RPC_URL);
    const network = await provider.getNetwork();
    console.log('✅ Connected to network:', network.name);
    console.log('   Chain ID:', network.chainId.toString());
    
    const blockNumber = await provider.getBlockNumber();
    console.log('   Current block:', blockNumber);
    console.log('');

    // 2. Test Wallet
    console.log('Step 2: Testing Wallet from Mnemonic...');
    const wallet = ethers.Wallet.fromPhrase(process.env.MNEMONIC).connect(provider);
    console.log('✅ Wallet address:', wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log('   Balance:', ethers.formatEther(balance), 'ETH');
    console.log('');

    // 3. Test Contract Connections
    console.log('Step 3: Testing Contract Connections...');
    
    const employeeRegistry = new ethers.Contract(
      process.env.ETH_EMPLOYEE_REGISTRY,
      employeeRegistryABI,
      wallet
    );
    console.log('✅ EmployeeRegistry connected:', process.env.ETH_EMPLOYEE_REGISTRY);
    
    const corePayroll = new ethers.Contract(
      process.env.ETH_CORE_PAYROLL,
      corePayrollABI,
      wallet
    );
    console.log('✅ CorePayroll connected:', process.env.ETH_CORE_PAYROLL);
    console.log('');

    // 4. Test Contract Reads
    console.log('Step 4: Testing Contract Reads...');
    
    const totalEmployees = await employeeRegistry.getTotalEmployees();
    console.log('✅ Total employees:', totalEmployees.toString());
    
    const ethBalance = await corePayroll.getBalance(ethers.ZeroAddress);
    console.log('✅ CorePayroll ETH balance:', ethers.formatEther(ethBalance), 'ETH');
    
    const owner = await employeeRegistry.owner();
    console.log('✅ Contract owner:', owner);
    console.log('');

    // 5. Test Role Checks
    console.log('Step 5: Testing Role Checks...');
    const ADMIN_ROLE = await employeeRegistry.ADMIN_ROLE();
    const hasAdminRole = await employeeRegistry.hasRole(ADMIN_ROLE, wallet.address);
    console.log('✅ Wallet has ADMIN_ROLE:', hasAdminRole);
    console.log('');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🎉 All Tests Passed!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('');
    console.log('Your backend is ready to interact with:');
    console.log('✅ Sepolia Testnet');
    console.log('✅ Deployed Smart Contracts');
    console.log('✅ Web3 Provider');
    console.log('✅ Wallet with', ethers.formatEther(balance), 'ETH');
    console.log('');
    console.log('Next: Start backend server with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Test Failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check .env file has correct values');
    console.error('2. Verify RPC URL is accessible');
    console.error('3. Ensure contract addresses are correct');
    console.error('4. Check private key matches deployer address');
    console.error('\nError details:', error);
  }
}

testBlockchainConnection();


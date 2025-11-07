// Fix address checksums
const { ethers } = require('ethers');

const addresses = {
  ETH_EMPLOYEE_REGISTRY: '0x58EDb2F5c939762F7042344Ae0D0C2d2bEE06a4B',
  ETH_INVOICE_MANAGER: '0x4335FF4532E49a2dafd95712aecFCE8c67BB869E',
  ETH_PAYMENT_APPROVAL: '0xF31b799Daf7B705a2259e3686C4a9B7C8f1E46bDA',
  ETH_CORE_PAYROLL: '0xce67D99908c15633886c4a38c67A8fC8ec86c304',
};

console.log('Checksummed Addresses:\n');
for (const [key, value] of Object.entries(addresses)) {
  // Convert to lowercase first, then checksum
  const checksummed = ethers.getAddress(value.toLowerCase());
  console.log(`${key}=${checksummed}`);
}
console.log('\n✅ Copy these to your backend/.env file!');


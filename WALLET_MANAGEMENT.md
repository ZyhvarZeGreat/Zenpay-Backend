# 💼 Company Wallet Management System

## Overview

The company wallet manages all funds used for payroll payments. Funds are deposited into the wallet, and payments are made from the wallet to employees.

## Architecture

### Company Wallet
- **One wallet per network** (Ethereum, Polygon, BSC)
- **Wallet address** = CorePayroll contract address
- **Tracks balances** for native tokens and ERC20 tokens
- **Records deposits** and withdrawals
- **Validates balance** before processing payments

## Database Models

### CompanyWallet
- Stores wallet information per network
- Links to balances, deposits, and withdrawals

### WalletBalance
- Tracks balance for each token per network
- Auto-updates when deposits/withdrawals occur
- Stores last updated timestamp

### WalletDeposit
- Records all deposits to company wallet
- Links to transaction hash
- Tracks who deposited and when

### WalletWithdrawal
- Records all withdrawals from company wallet
- Links to payments/batches
- Tracks withdrawal type (PAYMENT, TRANSFER, OTHER)

## Payment Flow with Wallet Management

```
1. Funds Deposited → Company Wallet
2. Payment Request → Check Balance ✅
3. Process Payment → Record Withdrawal
4. Update Balance → Track in Database
```

## Features

### Balance Checking
- ✅ Checks wallet balance before processing payments
- ✅ Prevents payments if insufficient funds
- ✅ Validates for both single and batch payments
- ✅ Checks balance on retry attempts

### Deposit Tracking
- ✅ Records all deposits to wallet
- ✅ Updates balance automatically
- ✅ Links to transaction hash
- ✅ Tracks who deposited

### Withdrawal Tracking
- ✅ Records all payment withdrawals
- ✅ Links withdrawals to payments/batches
- ✅ Updates balance automatically
- ✅ Tracks withdrawal type

### Balance Management
- ✅ Real-time balance from blockchain
- ✅ Cached in database for performance
- ✅ Auto-refreshes on deposits/withdrawals
- ✅ Supports multiple tokens per network

## API Endpoints

### Wallet Balance
```http
GET /api/v1/wallets/:network/balance?token=USDT
GET /api/v1/wallets/:network/balances
GET /api/v1/wallets/:network/summary
```

### Deposit Management
```http
POST /api/v1/wallets/:network/deposits
GET /api/v1/wallets/:network/deposits
```

### Withdrawal History
```http
GET /api/v1/wallets/:network/withdrawals
```

## Payment Processing Updates

### Before Processing
1. ✅ Check wallet balance
2. ✅ Validate sufficient funds
3. ✅ Throw error if insufficient

### After Processing
1. ✅ Record withdrawal
2. ✅ Update balance
3. ✅ Link to payment/batch

## Error Handling

### Insufficient Balance
```
Error: Insufficient balance in company wallet. 
Required: 5000 USDT, Network: ETHEREUM
```

### Response
- 400 Bad Request
- Clear error message
- Payment not processed

## Example Flow

### 1. Deposit Funds
```http
POST /api/v1/wallets/ETHEREUM/deposits
{
  "transactionHash": "0x123...",
  "amount": "10000",
  "token": "USDT"
}
```

### 2. Check Balance
```http
GET /api/v1/wallets/ETHEREUM/balance?token=USDT
→ Returns: { balance: "10000", ... }
```

### 3. Process Payment
```http
POST /api/v1/payments/single
{
  "employeeId": "emp-123",
  "network": "ETHEREUM"
}
→ Checks balance: 10000 >= 5000 ✅
→ Processes payment
→ Records withdrawal: 5000 USDT
```

### 4. Updated Balance
```http
GET /api/v1/wallets/ETHEREUM/balance?token=USDT
→ Returns: { balance: "5000", ... }
```

## Security

- ✅ Admin/Finance Manager only access
- ✅ All transactions recorded
- ✅ Balance validated before payments
- ✅ Withdrawal tracking for audit

---

**Company Wallet Management is fully integrated!** 💰


# Zenpay Payroll System - Backend API

Complete backend service for blockchain-based payroll management system.

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Express.js API Server                     │
└───────────┬─────────────────────────────────────────────────────┘
            │
    ┌───────┴────────┐
    │  Middleware    │
    │  - Auth        │
    │  - Validation  │
    │  - Rate Limit  │
    └───────┬────────┘
            │
    ┌───────┴────────────────────────────────────────┐
    │                                                  │
    ▼                                                  ▼
┌─────────────────┐                         ┌──────────────────┐
│   Controllers   │                         │    Services      │
│  - Auth         │                         │  - Blockchain    │
│  - Employees    │◄───────────────────────►│  - Payment       │
│  - Payments     │                         │  - Auth          │
│  - Invoices     │                         │  - Notification  │
│  - Analytics    │                         │  - Sync          │
└────────┬────────┘                         └────────┬─────────┘
         │                                           │
         ▼                                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PostgreSQL Database                         │
│                       (Prisma ORM)                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  Smart Contracts │
                  │  (Ethereum/       │
                  │   Polygon/BSC)    │
                  └──────────────────┘
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Database migrations
│   └── seed.js               # Database seeding
├── src/
│   ├── config/
│   │   ├── database.js       # Prisma configuration
│   │   └── blockchain.js     # Web3 provider setup
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── employeeController.js
│   │   ├── paymentController.js
│   │   ├── invoiceController.js
│   │   ├── analyticsController.js
│   │   └── notificationController.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── blockchainService.js
│   │   ├── paymentService.js
│   │   ├── syncService.js
│   │   └── notificationService.js
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   ├── validation.js     # Request validation
│   │   ├── rateLimit.js      # Rate limiting
│   │   └── errorHandler.js   # Global error handling
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── employeeRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── invoiceRoutes.js
│   │   ├── analyticsRoutes.js
│   │   └── notificationRoutes.js
│   ├── utils/
│   │   ├── logger.js         # Winston logger
│   │   ├── email.js          # Email service
│   │   ├── pdf.js            # PDF generation
│   │   └── helpers.js        # Utility functions
│   ├── validators/
│   │   └── schemas.js        # Joi validation schemas
│   ├── swagger.js            # API documentation
│   └── index.js              # Application entry point
├── logs/                     # Application logs
├── uploads/                  # File uploads
├── .env                      # Environment variables
├── .env.example              # Environment template
├── package.json
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Node.js v16 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
nano .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database (optional)
npm run prisma:seed

# Start development server
npm run dev
```

The API will be available at `http://localhost:5000`

## 📋 API Endpoints

### Authentication (`/api/v1/auth`)

```
POST   /register            - Register new user
POST   /login               - Login user
POST   /logout              - Logout user
POST   /refresh             - Refresh access token
POST   /forgot-password     - Request password reset
POST   /reset-password      - Reset password
POST   /verify-otp          - Verify OTP code
POST   /resend-otp          - Resend OTP code
GET    /me                  - Get current user
PUT    /profile             - Update profile
```

### Employees (`/api/v1/employees`)

```
GET    /                    - List all employees
POST   /                    - Add new employee
GET    /:id                 - Get employee details
PUT    /:id                 - Update employee
DELETE /:id                 - Remove employee
PATCH  /:id/status          - Update employee status
GET    /department/:dept    - Get employees by department
GET    /active              - Get active employees
```

### Payments (`/api/v1/payments`)

```
GET    /                    - List all payments
POST   /single              - Process single payment
POST   /batch               - Process batch payments
POST   /batch/upload        - Upload CSV for batch payment
GET    /:id                 - Get payment details
GET    /employee/:id        - Get employee payment history
POST   /retry/:id           - Retry failed payment
GET    /status/:txHash      - Check transaction status
```

### Invoices (`/api/v1/invoices`)

```
GET    /                    - List all invoices
POST   /                    - Create invoice
GET    /:id                 - Get invoice details
PUT    /:id                 - Update invoice
DELETE /:id                 - Cancel invoice
PATCH  /:id/status          - Update invoice status
GET    /employee/:id        - Get employee invoices
GET    /pending             - Get pending invoices
POST   /:id/pay             - Mark invoice as paid
```

### Receipts (`/api/v1/receipts`)

```
GET    /                    - List all receipts
GET    /:id                 - Get receipt details
GET    /invoice/:id         - Get receipt by invoice
GET    /transaction/:hash   - Get receipt by tx hash
GET    /:id/download        - Download receipt PDF
```

### Analytics (`/api/v1/analytics`)

```
GET    /dashboard           - Get dashboard metrics
GET    /department          - Department-wise spending
GET    /token-distribution  - Token distribution analytics
GET    /payment-history     - Payment history by date range
GET    /gas-costs           - Gas cost tracking
GET    /employee/:id/history - Employee payment history
GET    /export/csv          - Export data to CSV
GET    /export/pdf          - Export report to PDF
```

### Notifications (`/api/v1/notifications`)

```
GET    /                    - List user notifications
GET    /:id                 - Get notification details
PATCH  /:id/read            - Mark as read
PATCH  /read-all            - Mark all as read
DELETE /:id                 - Delete notification
GET    /unread-count        - Get unread count
GET    /preferences         - Get notification preferences
PUT    /preferences         - Update preferences
```

### Approvals (`/api/v1/approvals`)

```
GET    /requests            - List payment requests
POST   /requests            - Create payment request
GET    /requests/:id        - Get request details
POST   /requests/:id/approve - Approve request
POST   /requests/:id/reject  - Reject request
POST   /requests/:id/cancel  - Cancel request
GET    /requests/:id/history - Get approval history
GET    /pending             - Get pending requests
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

### JWT Token Flow

1. **Login**: Receive access token (1h) and refresh token (7d)
2. **Access**: Use access token for API requests
3. **Refresh**: Use refresh token to get new access token before expiry
4. **Logout**: Invalidate refresh token

## 🛡️ Security Features

### Rate Limiting

```javascript
// Per-endpoint limits (in-memory or database)
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per 15 minutes
```

### Password Security

- Bcrypt hashing with salt rounds
- Password complexity requirements
- Password reset tokens expire in 1 hour

### OTP Verification

- 6-digit OTP codes
- Stored in database
- Expires in 10 minutes
- Max 3 attempts

### Audit Logging

All authentication and critical operations are logged:
- User login/logout
- Password changes
- Role changes
- Payment processing
- Admin actions

## 🔄 Blockchain Integration

### Supported Networks

- **Ethereum** (Mainnet/Sepolia)
- **Polygon** (Mainnet/Mumbai)
- **BSC** (Mainnet/Testnet)

### Transaction Management

1. **Build Transaction**: Prepare transaction data
2. **Estimate Gas**: Calculate gas requirements
3. **Sign & Send**: Sign with private key and broadcast
4. **Monitor**: Poll for confirmation (every 10-15 seconds)
5. **Retry Logic**: Up to 3 attempts for failed transactions
6. **Update DB**: Sync transaction status to database

### Event Synchronization

Cron job runs every minute to:
1. Fetch new blockchain events
2. Parse event data
3. Update database records
4. Wait for block confirmations (3-5 blocks)
5. Trigger notifications

## 📊 Database Models

### Core Models

- **User**: Authentication and user management
- **Employee**: Employee records synced with blockchain
- **Payment**: Payment transactions and status
- **Batch**: Batch payment records
- **Invoice**: Invoice generation and tracking
- **Receipt**: Immutable payment receipts
- **PaymentRequest**: Approval workflow
- **Notification**: User notifications
- **AuditLog**: Audit trail

## 📧 Notifications

### Email Service

**SendGrid (Primary)**:
```javascript
SENDGRID_API_KEY=your_key
```

**SMTP (Fallback)**:
```javascript
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

### Email Templates

- Payment completed
- Payment failed
- Invoice generated
- Approval required
- Password reset
- OTP verification

### Notification Channels

1. **Email**: Critical notifications sent synchronously
2. **In-App**: Stored in database, queried by user
3. **Cron**: Non-critical emails sent via cron (every 5 minutes)

## 🔄 Cron Jobs

### Blockchain Sync (Every Minute)

```javascript
*/1 * * * * - Fetch new events from blockchain
             - Update payment status
             - Check confirmations
             - Sync to database
```

### Email Queue (Every 5 Minutes)

```javascript
*/5 * * * * - Send pending non-critical emails
             - Retry failed emails
             - Clean up old emails
```

### Analytics Cache (Every Hour)

```javascript
0 * * * * - Calculate daily metrics
           - Update analytics tables
           - Generate reports
```

## 📦 Batch Payment Processing

### CSV Upload Format

```csv
employee_id,wallet_address,amount,token
1,0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb,5000,0x0000000000000000000000000000000000000000
2,0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2,4500,0x0000000000000000000000000000000000000000
```

### Processing Flow

1. **Upload**: Parse CSV/Excel file
2. **Validate**: Check employee IDs, wallet addresses, amounts
3. **Balance Check**: Verify contract has sufficient balance
4. **Duplicate Detection**: Check for recent payments
5. **Build Transaction**: Create batch payment transaction
6. **Process**: Execute transaction with status tracking
7. **Notify**: Send completion/failure notifications

## 📈 Analytics

### Dashboard Metrics (Direct SQL Queries)

- Total paid amount (all time)
- Payments this month
- Pending payments
- Failed transactions
- Active employees
- Average gas cost
- Department breakdown
- Token distribution

### Report Generation

- CSV export for all data tables
- PDF reports with charts
- Date range filtering
- Department filtering
- Custom SQL aggregations

## 🐛 Error Handling

### Error Response Format

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {},
  "timestamp": "2024-11-04T12:00:00.000Z"
}
```

### Error Types

- `VALIDATION_ERROR` (400)
- `UNAUTHORIZED` (401)
- `FORBIDDEN` (403)
- `NOT_FOUND` (404)
- `CONFLICT` (409)
- `INTERNAL_ERROR` (500)
- `BLOCKCHAIN_ERROR` (503)

## 📝 Logging

### Log Levels

- **error**: Application errors
- **warn**: Warning messages
- **info**: General information
- **debug**: Detailed debugging (development only)

### Log Files

- `logs/combined.log`: All logs
- `logs/error.log`: Error logs only

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## 📖 API Documentation

Interactive API documentation available at:
```
http://localhost:5000/api-docs
```

Built with Swagger/OpenAPI specification.

## 🚀 Deployment

### Environment Setup

1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy smart contracts to blockchain
4. Update contract addresses in `.env`
5. Run migrations
6. Start server

### Production Considerations

- Use PM2 or Docker for process management
- Set up HTTPS with SSL certificate
- Configure firewall rules
- Enable database backups
- Set up monitoring (e.g., Sentry)
- Use environment-specific configs
- Enable production logging

## 🔧 Configuration

### Database

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/zenpay"
```

### Blockchain

```env
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_KEY
ETHEREUM_PRIVATE_KEY=0x...
ETH_CORE_PAYROLL=0x...
```

### JWT

```env
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
```

## 📞 Support

For issues and questions:
- Check the API documentation
- Review error logs
- Check database connection
- Verify blockchain RPC endpoints
- Ensure smart contracts are deployed

## 📄 License

MIT License - See LICENSE file for details

---

**Built with ❤️ for decentralized payroll management**


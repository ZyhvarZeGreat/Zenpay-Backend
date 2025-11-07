# 🚀 Quick Start - PostgreSQL Setup

## Step-by-Step Instructions

### 1️⃣ Install PostgreSQL

**Windows:**
```powershell
# Download from: https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

### 2️⃣ Create Database & User

**Open PostgreSQL terminal:**

```bash
# Windows: Search "SQL Shell (psql)" or "pgAdmin"
# Mac/Linux: 
sudo -u postgres psql
```

**Run these commands:**

```sql
-- Create user
CREATE USER zenpay_user WITH PASSWORD 'zenpay_password_123';

-- Create database
CREATE DATABASE zenpay_db OWNER zenpay_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zenpay_db TO zenpay_user;

-- Connect to database
\c zenpay_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO zenpay_user;

-- Exit
\q
```

---

### 3️⃣ Configure Environment

**Copy the template:**

```bash
cd backend
cp .env.template .env
```

**Edit `.env` file and update these critical lines:**

```env
# Database - Change password if needed
DATABASE_URL="postgresql://zenpay_user:zenpay_password_123@localhost:5432/zenpay_db?schema=public"

# JWT Secrets - Generate new ones for production!
JWT_SECRET=your_very_long_secret_key_at_least_32_characters
JWT_REFRESH_SECRET=another_very_long_secret_key_different_from_above

# Smart Contract Addresses - Update after deployment
ETH_EMPLOYEE_REGISTRY=0x5FbDB2315678afecb367f032d93F642f64180aa3
ETH_INVOICE_MANAGER=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ETH_PAYMENT_APPROVAL=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
ETH_CORE_PAYROLL=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
```

---

### 4️⃣ Generate Strong Secrets

**Run this to generate secure JWT secrets:**

```bash
# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output and paste into your `.env` file**

---

### 5️⃣ Install Dependencies & Setup Database

```bash
cd backend

# Install packages
npm install

# Generate Prisma client
npm run prisma:generate

# Run database migrations (creates all tables)
npm run prisma:migrate
```

When prompted for migration name, type: `init`

---

### 6️⃣ Verify Database Setup

**Test connection:**

```bash
npm run prisma:studio
```

This opens a GUI at http://localhost:5555 where you can see all your tables!

---

### 7️⃣ Start the Server

```bash
# Development mode with auto-reload
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Server running on port 5000
```

---

## 🧪 Test the API

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test API
curl http://localhost:5000/api/v1/test
```

---

## ✅ Your `.env` File Should Look Like This:

```env
# Minimum required configuration
NODE_ENV=development
PORT=5000

# Database (Update password!)
DATABASE_URL="postgresql://zenpay_user:zenpay_password_123@localhost:5432/zenpay_db?schema=public"

# JWT (Generate new secrets!)
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
JWT_REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Blockchain (Local Hardhat)
ETHEREUM_RPC_URL=http://127.0.0.1:8545
ETHEREUM_CHAIN_ID=31337
ETHEREUM_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Contract Addresses (Update after deployment)
ETH_EMPLOYEE_REGISTRY=0x5FbDB2315678afecb367f032d93F642f64180aa3
ETH_INVOICE_MANAGER=0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
ETH_PAYMENT_APPROVAL=0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
ETH_CORE_PAYROLL=0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9

# Email (Optional - can leave empty for now)
SENDGRID_API_KEY=
FROM_EMAIL=noreply@zenpay.com

# Logging
LOG_LEVEL=info
```

---

## 🔧 Troubleshooting

### Can't connect to PostgreSQL?

```bash
# Check if running
# Windows:
pg_ctl status

# Mac:
brew services list | grep postgresql

# Linux:
sudo systemctl status postgresql
```

### Wrong password?

```sql
-- Reset password as postgres user
sudo -u postgres psql
ALTER USER zenpay_user WITH PASSWORD 'new_password';
\q
```

### Database doesn't exist?

```bash
createdb -U zenpay_user zenpay_db
```

### Migration errors?

```bash
# Reset and try again
npm run prisma:migrate reset
npm run prisma:migrate
```

---

## 🎉 You're Done!

Your database is configured and ready to use!

**Next steps:**
1. ✅ Database setup complete
2. ✅ Server running
3. ➡️ Start adding employees via API
4. ➡️ Process payments
5. ➡️ Build frontend (optional)

Check `API_ENDPOINTS.md` for all available endpoints!


# PostgreSQL Database Setup Guide

Complete guide to set up PostgreSQL for Zenpay Payroll System.

## 📦 Step 1: Install PostgreSQL

### Windows

**Option 1: Official Installer (Recommended)**

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Port: `5432` (default)
   - Password: Set a secure password (remember this!)
   - Locale: Default
4. Complete installation

**Option 2: Using Chocolatey**

```powershell
choco install postgresql
```

### macOS

**Using Homebrew:**

```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Verify Installation

```bash
# Check PostgreSQL version
psql --version

# Should output: psql (PostgreSQL) 15.x
```

## 🔐 Step 2: Create Database User

### Windows

Open **SQL Shell (psql)** or **pgAdmin**

```sql
-- Connect as postgres user (default password from installation)
-- Then create a new user for Zenpay

CREATE USER zenpay_user WITH PASSWORD 'your_secure_password';
ALTER USER zenpay_user CREATEDB;
```

### macOS/Linux

```bash
# Switch to postgres user
sudo -u postgres psql

# Then run these SQL commands:
```

```sql
CREATE USER zenpay_user WITH PASSWORD 'your_secure_password';
ALTER USER zenpay_user CREATEDB;
\q
```

## 🗄️ Step 3: Create Database

### Using psql

```bash
# Connect as zenpay_user
psql -U zenpay_user -h localhost -d postgres

# Create database
CREATE DATABASE zenpay_db;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE zenpay_db TO zenpay_user;

# Connect to the database
\c zenpay_db

# Grant schema privileges
GRANT ALL ON SCHEMA public TO zenpay_user;

# Exit
\q
```

### Using pgAdmin (GUI)

1. Open pgAdmin
2. Right-click on "Databases" → "Create" → "Database"
3. Name: `zenpay_db`
4. Owner: `zenpay_user`
5. Click "Save"

### Quick Script (Automated)

```bash
# Create database (Linux/macOS)
sudo -u postgres createdb -O zenpay_user zenpay_db

# Windows (run in Command Prompt as Administrator)
createdb -U postgres -O zenpay_user zenpay_db
```

## 🔗 Step 4: Configure Database Connection

### Update `.env` file

```bash
cd backend

# If .env doesn't exist, copy from example
cp .env.example .env

# Edit .env
nano .env  # or use your favorite editor
```

**Update this line:**

```env
# Replace the SQLite connection with PostgreSQL
DATABASE_URL="postgresql://zenpay_user:your_secure_password@localhost:5432/zenpay_db?schema=public"
```

**Connection String Format:**
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Example values:**
- User: `zenpay_user`
- Password: `your_secure_password`
- Host: `localhost` (or IP address)
- Port: `5432` (default PostgreSQL port)
- Database: `zenpay_db`

### Verify Connection String

Create a test file:

```bash
# Create test file
cat > test-db-connection.js << 'EOF'
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('📊 PostgreSQL version:', result[0].version);
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
EOF
```

```bash
# Run test
node test-db-connection.js
```

## 🔄 Step 5: Run Prisma Migrations

### Generate Prisma Client

```bash
npm run prisma:generate
```

### Create Initial Migration

```bash
npm run prisma:migrate
```

When prompted:
- Enter migration name: `init`

This will:
1. Create all database tables
2. Set up relationships
3. Create indexes

### Verify Tables Created

```bash
# Connect to database
psql -U zenpay_user -h localhost -d zenpay_db

# List all tables
\dt

# Should see tables like:
# users
# employees
# payments
# invoices
# etc.

# Exit
\q
```

## 📊 Step 6: Open Prisma Studio

Prisma Studio is a GUI to view and edit your database:

```bash
npm run prisma:studio
```

Opens at: http://localhost:5555

You can:
- View all tables
- Browse data
- Edit records
- Test relationships

## ✅ Step 7: Test Complete Setup

Run this comprehensive test:

```bash
# Create test script
cat > backend/test-complete-setup.js << 'EOF'
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testCompleteSetup() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Database Setup...\n');
    
    // 1. Test connection
    await prisma.$connect();
    console.log('✅ Step 1: Database connected');
    
    // 2. Test table existence
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log(`✅ Step 2: Found ${tables.length} tables`);
    console.log('   Tables:', tables.map(t => t.table_name).join(', '));
    
    // 3. Test write operation
    const testUser = await prisma.user.create({
      data: {
        email: 'test@zenpay.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User',
        role: 'ADMIN',
      },
    });
    console.log('✅ Step 3: Write operation successful');
    console.log('   Created user:', testUser.email);
    
    // 4. Test read operation
    const users = await prisma.user.findMany();
    console.log(`✅ Step 4: Read operation successful (${users.length} users)`);
    
    // 5. Test delete operation
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Step 5: Delete operation successful');
    
    console.log('\n🎉 All tests passed! Database is ready to use.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nTroubleshooting tips:');
    console.error('1. Check DATABASE_URL in .env file');
    console.error('2. Verify PostgreSQL is running');
    console.error('3. Check user permissions');
    console.error('4. Run: npm run prisma:migrate');
  } finally {
    await prisma.$disconnect();
  }
}

testCompleteSetup();
EOF

node backend/test-complete-setup.js
```

## 🎯 Quick Setup Script (All-in-One)

Save this as `backend/setup-database.sh`:

```bash
#!/bin/bash

echo "🚀 Zenpay Database Setup"
echo "========================"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed"
    echo "Please install PostgreSQL first"
    exit 1
fi

echo "✅ PostgreSQL is installed"
echo ""

# Get database credentials
read -p "Enter database user (default: zenpay_user): " DB_USER
DB_USER=${DB_USER:-zenpay_user}

read -sp "Enter database password: " DB_PASS
echo ""

read -p "Enter database name (default: zenpay_db): " DB_NAME
DB_NAME=${DB_NAME:-zenpay_db}

read -p "Enter database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Enter database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Create connection string
DB_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

echo ""
echo "📝 Updating .env file..."

# Update .env file
if [ -f .env ]; then
    # Backup existing .env
    cp .env .env.backup
    # Update DATABASE_URL
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"${DB_URL}\"|" .env
    echo "✅ .env file updated (backup saved as .env.backup)"
else
    # Create new .env
    cp .env.example .env
    sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=\"${DB_URL}\"|" .env
    echo "✅ .env file created"
fi

echo ""
echo "🔄 Running Prisma migrations..."
npm run prisma:generate
npm run prisma:migrate

echo ""
echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. npm run prisma:studio  (Open database GUI)"
echo "  2. npm run dev            (Start server)"
```

Make it executable and run:

```bash
chmod +x backend/setup-database.sh
./backend/setup-database.sh
```

## 🔧 Common Issues & Solutions

### Issue 1: "Connection refused"

**Problem**: Can't connect to PostgreSQL

**Solutions**:

```bash
# Check if PostgreSQL is running
# Windows
pg_ctl status -D "C:\Program Files\PostgreSQL\15\data"

# macOS/Linux
sudo systemctl status postgresql
# or
brew services list | grep postgresql
```

**Start PostgreSQL**:

```bash
# Windows
pg_ctl start -D "C:\Program Files\PostgreSQL\15\data"

# macOS
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

### Issue 2: "Authentication failed"

**Problem**: Wrong password or user doesn't exist

**Solutions**:

```bash
# Reset password (as postgres user)
sudo -u postgres psql

# In psql:
ALTER USER zenpay_user WITH PASSWORD 'new_password';
\q
```

### Issue 3: "Database does not exist"

**Problem**: Database not created

**Solution**:

```bash
# Create database
createdb -U zenpay_user zenpay_db

# Or using psql
psql -U postgres
CREATE DATABASE zenpay_db OWNER zenpay_user;
\q
```

### Issue 4: "Permission denied"

**Problem**: User lacks permissions

**Solution**:

```sql
-- As postgres user
GRANT ALL PRIVILEGES ON DATABASE zenpay_db TO zenpay_user;
GRANT ALL ON SCHEMA public TO zenpay_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO zenpay_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO zenpay_user;
```

### Issue 5: Prisma migration fails

**Problem**: Migration errors

**Solutions**:

```bash
# Reset database (WARNING: Deletes all data)
npm run prisma:migrate reset

# Or manually:
psql -U zenpay_user -d zenpay_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run prisma:migrate
```

## 📱 Using GUI Tools

### pgAdmin 4

1. Download: https://www.pgadmin.org/download/
2. Install and open
3. Add server:
   - Name: Zenpay
   - Host: localhost
   - Port: 5432
   - Database: zenpay_db
   - Username: zenpay_user
   - Password: your_password

### DBeaver (Universal)

1. Download: https://dbeaver.io/download/
2. New Connection → PostgreSQL
3. Enter credentials
4. Test connection

### TablePlus (macOS)

1. Download: https://tableplus.com/
2. Create new connection
3. Enter PostgreSQL details

## 🔐 Security Best Practices

### Production Environment

```env
# Use strong passwords
DATABASE_URL="postgresql://zenpay_prod:very_strong_password_here@db.example.com:5432/zenpay_prod?schema=public&sslmode=require"
```

### Enable SSL

```bash
# In postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'
```

### Connection Pooling

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  
  // Connection pooling
  connectionLimit = 10
}
```

## 📊 Database Backup

### Manual Backup

```bash
# Backup database
pg_dump -U zenpay_user -d zenpay_db > backup.sql

# Restore database
psql -U zenpay_user -d zenpay_db < backup.sql
```

### Automated Backup Script

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

pg_dump -U zenpay_user -d zenpay_db > "$BACKUP_DIR/zenpay_backup_$DATE.sql"
echo "Backup created: $BACKUP_DIR/zenpay_backup_$DATE.sql"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "zenpay_backup_*.sql" -mtime +7 -delete
```

## ✅ Final Checklist

- [ ] PostgreSQL installed and running
- [ ] Database user created
- [ ] Database created
- [ ] `.env` file updated with correct DATABASE_URL
- [ ] Prisma client generated (`npm run prisma:generate`)
- [ ] Migrations run successfully (`npm run prisma:migrate`)
- [ ] Connection test passed
- [ ] Prisma Studio accessible
- [ ] Server starts without database errors

## 🚀 Next Steps

After database setup:

```bash
# 1. Start server
npm run dev

# 2. Open Prisma Studio (optional)
npm run prisma:studio

# 3. Test API endpoints
curl http://localhost:5000/health
```

Your database is now ready for use! 🎉

---

**Need Help?**

- PostgreSQL Docs: https://www.postgresql.org/docs/
- Prisma Docs: https://www.prisma.io/docs/
- Troubleshooting: Check logs in `logs/` directory


#!/bin/bash

# Quick PostgreSQL Setup Script for Zenpay
# This script helps set up the database quickly

echo "╔════════════════════════════════════════╗"
echo "║   Zenpay Database Quick Setup          ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo ""
    echo "Installation instructions:"
    echo "  Windows: https://www.postgresql.org/download/windows/"
    echo "  macOS:   brew install postgresql@15"
    echo "  Linux:   sudo apt install postgresql"
    exit 1
fi

echo "✅ PostgreSQL found"
echo ""

# Get configuration
echo "📋 Database Configuration"
echo "─────────────────────────────────────────"
read -p "Database user (default: zenpay_user): " DB_USER
DB_USER=${DB_USER:-zenpay_user}

read -sp "Database password: " DB_PASS
echo ""

read -p "Database name (default: zenpay_db): " DB_NAME
DB_NAME=${DB_NAME:-zenpay_db}

read -p "Database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo "─────────────────────────────────────────"
echo "Configuration:"
echo "  User:     $DB_USER"
echo "  Database: $DB_NAME"
echo "  Host:     $DB_HOST"
echo "  Port:     $DB_PORT"
echo "─────────────────────────────────────────"
echo ""

read -p "Proceed with setup? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Setup cancelled."
    exit 0
fi

# Create database URL
DB_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

echo ""
echo "📝 Step 1: Updating .env file..."

if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo "   Backup created"
fi

if [ ! -f .env ]; then
    cp .env.example .env
fi

# Update DATABASE_URL in .env
if grep -q "^DATABASE_URL=" .env; then
    sed -i.bak "s|^DATABASE_URL=.*|DATABASE_URL=\"${DB_URL}\"|" .env
else
    echo "DATABASE_URL=\"${DB_URL}\"" >> .env
fi

echo "✅ Step 1: .env updated"

echo ""
echo "🔧 Step 2: Installing dependencies..."
npm install --silent
echo "✅ Step 2: Dependencies installed"

echo ""
echo "🔄 Step 3: Generating Prisma client..."
npm run prisma:generate --silent
echo "✅ Step 3: Prisma client generated"

echo ""
echo "🗄️  Step 4: Running database migrations..."
npm run prisma:migrate --silent
echo "✅ Step 4: Migrations complete"

echo ""
echo "🧪 Step 5: Testing connection..."
node -e "
const { PrismaClient } = require('@prisma/client');
async function test() {
  const prisma = new PrismaClient();
  try {
    await prisma.\$connect();
    console.log('✅ Step 5: Database connection successful!');
  } catch (e) {
    console.log('❌ Step 5: Connection failed:', e.message);
    process.exit(1);
  } finally {
    await prisma.\$disconnect();
  }
}
test();
"

echo ""
echo "╔════════════════════════════════════════╗"
echo "║   ✅ Database Setup Complete!          ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. npm run prisma:studio  # View database in GUI"
echo "  2. npm run dev            # Start development server"
echo ""
echo "Database URL saved in .env file"
echo ""


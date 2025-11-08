#!/bin/bash

# Quick Migration Script for Linux/Mac
# Uses your local database: zenpay_dev

LOCAL_DB_HOST="localhost"
LOCAL_DB_PORT="5432"
LOCAL_DB_NAME="zenpay_dev"
LOCAL_DB_USER="postgres"
LOCAL_DB_PASSWORD="admin"

DO_DB_HOST="zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com"
DO_DB_PORT="25060"
DO_DB_NAME="defaultdb"
DO_DB_USER="doadmin"
DO_DB_PASSWORD="${DO_DB_PASSWORD:-}"
if [ -z "$DO_DB_PASSWORD" ]; then
    echo "❌ DO_DB_PASSWORD environment variable not set!"
    echo "   Set it with: export DO_DB_PASSWORD='YOUR_PASSWORD'"
    exit 1
fi

DUMP_FILE="zenpay_migration_$(date +%Y%m%d_%H%M%S).dump"

echo "🔄 Starting Database Migration"
echo "================================"
echo ""

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo "❌ pg_dump not found!"
    echo ""
    echo "Please install PostgreSQL client tools:"
    echo "   macOS: brew install postgresql"
    echo "   Linux: sudo apt-get install postgresql-client"
    exit 1
fi

echo "✅ pg_dump found"
echo ""
echo "📦 Step 1: Creating dump from local database..."
echo "   Source: $LOCAL_DB_HOST:$LOCAL_DB_PORT/$LOCAL_DB_NAME"
echo ""

export PGPASSWORD="$LOCAL_DB_PASSWORD"

if ! pg_dump -U "$LOCAL_DB_USER" \
    -h "$LOCAL_DB_HOST" \
    -p "$LOCAL_DB_PORT" \
    -d "$LOCAL_DB_NAME" \
    -F c \
    -f "$DUMP_FILE" \
    --verbose; then
    echo ""
    echo "❌ Failed to create dump"
    echo ""
    echo "Troubleshooting:"
    echo "   1. Check if PostgreSQL is running"
    echo "   2. Verify database credentials"
    echo "   3. Ensure database '$LOCAL_DB_NAME' exists"
    exit 1
fi

unset PGPASSWORD

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo ""
echo "✅ Dump created successfully!"
echo "   File: $DUMP_FILE"
echo "   Size: $DUMP_SIZE"
echo ""

echo "📤 Step 2: Restoring to DigitalOcean..."
echo "   Target: $DO_DB_HOST:$DO_DB_PORT/$DO_DB_NAME"
echo ""
echo "⚠️  IMPORTANT: Make sure your IP is added to Trusted Sources in DigitalOcean!"
echo ""

read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
    echo "Migration cancelled."
    exit 0
fi

export PGPASSWORD="$DO_DB_PASSWORD"

if ! pg_restore -U "$DO_DB_USER" \
    -h "$DO_DB_HOST" \
    -p "$DO_DB_PORT" \
    -d "$DO_DB_NAME" \
    --verbose \
    --no-owner \
    --no-acl \
    "$DUMP_FILE"; then
    echo ""
    echo "❌ Migration failed"
    echo ""
    echo "Troubleshooting:"
    echo "   1. Check Trusted Sources in DigitalOcean dashboard"
    echo "   2. Add your current IP address"
    echo "   3. Verify connection details"
    echo ""
    echo "💾 Dump file preserved: $DUMP_FILE"
    exit 1
fi

unset PGPASSWORD

echo ""
echo "✅ Migration completed successfully!"
echo ""

echo "🔍 Step 3: Verifying migration..."

export PGPASSWORD="$DO_DB_PASSWORD"
TABLE_COUNT=$(psql -U "$DO_DB_USER" -h "$DO_DB_HOST" -p "$DO_DB_PORT" -d "$DO_DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
unset PGPASSWORD

if [ ! -z "$TABLE_COUNT" ]; then
    echo "   ✅ Tables migrated: $TABLE_COUNT"
fi

echo ""
read -p "🗑️  Delete dump file? (yes/no, default: yes): " cleanup
if [ "$cleanup" != "no" ] && [ "$cleanup" != "n" ]; then
    rm "$DUMP_FILE"
    echo "✅ Dump file deleted"
else
    echo "💾 Dump file preserved: $DUMP_FILE"
fi

echo ""
echo "🎉 Migration Complete!"
echo ""
echo "Next steps:"
echo "   1. Update DATABASE_URL in .env file:"
echo "      DATABASE_URL=\"postgresql://doadmin:YOUR_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require\""
echo "   2. Test connection: node test-db-connection.js"
echo "   3. Start your application: npm start"
echo ""


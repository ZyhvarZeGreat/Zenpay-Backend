#!/bin/bash

# Database Migration Script for DigitalOcean PostgreSQL
# Migrates data from existing database to DigitalOcean managed PostgreSQL

# Configuration - UPDATE THESE VALUES
OLD_DB_HOST="localhost"
OLD_DB_NAME="zenpay_db"
OLD_DB_USER="postgres"
NEW_DB_HOST="zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com"
NEW_DB_PORT="25060"
NEW_DB_NAME="defaultdb"
NEW_DB_USER="doadmin"
NEW_DB_PASSWORD="${DO_DB_PASSWORD:-}"
if [ -z "$NEW_DB_PASSWORD" ]; then
    echo "❌ DO_DB_PASSWORD environment variable not set!"
    echo "   Set it with: export DO_DB_PASSWORD='YOUR_PASSWORD'"
    exit 1
fi
DUMP_FILE="zenpay_migration_$(date +%Y%m%d_%H%M%S).dump"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔄 Starting database migration...${NC}"
echo ""

# Check if pg_dump is available
if ! command -v pg_dump &> /dev/null; then
    echo -e "${RED}❌ pg_dump not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Check if pg_restore is available
if ! command -v pg_restore &> /dev/null; then
    echo -e "${RED}❌ pg_restore not found. Please install PostgreSQL client tools.${NC}"
    exit 1
fi

# Step 1: Create dump from old database
echo -e "${YELLOW}📦 Step 1: Creating dump from source database...${NC}"
echo "   Host: $OLD_DB_HOST"
echo "   Database: $OLD_DB_NAME"
echo "   User: $OLD_DB_USER"
echo ""

pg_dump -U "$OLD_DB_USER" \
  -h "$OLD_DB_HOST" \
  -d "$OLD_DB_NAME" \
  -F c \
  -f "$DUMP_FILE" \
  --verbose

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to create dump${NC}"
    echo "   Please check:"
    echo "   - Database connection details"
    echo "   - User permissions"
    echo "   - Database exists"
    exit 1
fi

# Check if dump file was created
if [ ! -f "$DUMP_FILE" ]; then
    echo -e "${RED}❌ Dump file was not created${NC}"
    exit 1
fi

DUMP_SIZE=$(du -h "$DUMP_FILE" | cut -f1)
echo -e "${GREEN}✅ Dump created successfully!${NC}"
echo "   File: $DUMP_FILE"
echo "   Size: $DUMP_SIZE"
echo ""

# Step 2: Restore to DigitalOcean
echo -e "${YELLOW}📤 Step 2: Restoring to DigitalOcean PostgreSQL...${NC}"
echo "   Host: $NEW_DB_HOST"
echo "   Port: $NEW_DB_PORT"
echo "   Database: $NEW_DB_NAME"
echo "   User: $NEW_DB_USER"
echo ""

export PGPASSWORD="$NEW_DB_PASSWORD"

pg_restore \
  -U "$NEW_DB_USER" \
  -h "$NEW_DB_HOST" \
  -p "$NEW_DB_PORT" \
  -d "$NEW_DB_NAME" \
  --verbose \
  --no-owner \
  --no-acl \
  "$DUMP_FILE"

RESTORE_EXIT_CODE=$?
unset PGPASSWORD

if [ $RESTORE_EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Migration completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}📊 Verifying migration...${NC}"
    
    # Quick verification
    export PGPASSWORD="$NEW_DB_PASSWORD"
    TABLE_COUNT=$(PGPASSWORD="$NEW_DB_PASSWORD" psql -U "$NEW_DB_USER" -h "$NEW_DB_HOST" -p "$NEW_DB_PORT" -d "$NEW_DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
    unset PGPASSWORD
    
    if [ ! -z "$TABLE_COUNT" ]; then
        echo "   Tables migrated: $TABLE_COUNT"
    fi
    
    echo ""
    echo -e "${YELLOW}🗑️  Cleaning up dump file...${NC}"
    rm "$DUMP_FILE"
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    echo ""
    echo -e "${CYAN}🎉 Migration successful!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update DATABASE_URL in your .env file"
    echo "2. Test connection: node test-db-connection.js"
    echo "3. Start your application"
else
    echo ""
    echo -e "${RED}❌ Migration failed${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check Trusted Sources in DigitalOcean dashboard"
    echo "2. Verify connection details"
    echo "3. Check database permissions"
    echo ""
    echo -e "${YELLOW}💾 Dump file preserved: $DUMP_FILE${NC}"
    echo "   You can retry the restore manually:"
    echo "   PGPASSWORD=\"$NEW_DB_PASSWORD\" pg_restore -U $NEW_DB_USER -h $NEW_DB_HOST -p $NEW_DB_PORT -d $NEW_DB_NAME --verbose --no-owner --no-acl $DUMP_FILE"
    exit 1
fi


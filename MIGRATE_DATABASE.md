# 🔄 Database Migration Guide - DigitalOcean PostgreSQL

Complete guide for migrating your existing database to DigitalOcean PostgreSQL.

## 📋 Migration Methods

1. **pg_restore** - For binary dumps (`.dump`, `.backup`)
2. **psql** - For SQL text dumps (`.sql`)
3. **Prisma Migrate** - For fresh setup (recommended if starting fresh)

---

## Method 1: Using pg_restore (Binary Dump)

### Step 1: Create Dump from Existing Database

If you have a local PostgreSQL database:

```bash
# Create a binary dump
pg_dump -U your_username -h localhost -d your_database_name -F c -f zenpay_backup.dump

# Or create a custom format dump (recommended)
pg_dump -U your_username -h localhost -d your_database_name -F c -f zenpay_backup.dump
```

**Options:**
- `-F c` = Custom format (binary, compressed)
- `-F t` = Tar format
- `-F p` = Plain text SQL (use with psql instead)

### Step 2: Restore to DigitalOcean

```bash
# Set password as environment variable (recommended)
export PGPASSWORD="YOUR_DATABASE_PASSWORD"

# Restore the dump
pg_restore \
  -U doadmin \
  -h zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com \
  -p 25060 \
  -d defaultdb \
  --verbose \
  --no-owner \
  --no-acl \
  zenpay_backup.dump
```

**Or in one line:**
```bash
PGPASSWORD="YOUR_DATABASE_PASSWORD" pg_restore -U doadmin -h zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com -p 25060 -d defaultdb --verbose --no-owner --no-acl zenpay_backup.dump
```

**Flags explained:**
- `--verbose` = Show progress
- `--no-owner` = Don't try to set ownership (important for managed DBs)
- `--no-acl` = Don't restore access control lists

---

## Method 2: Using psql (SQL Text Dump)

### Step 1: Create SQL Dump

```bash
# Create a plain SQL dump
pg_dump -U your_username -h localhost -d your_database_name -F p -f zenpay_backup.sql
```

### Step 2: Restore to DigitalOcean

```bash
# Restore SQL dump
PGPASSWORD="YOUR_DATABASE_PASSWORD" psql \
  -U doadmin \
  -h zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com \
  -p 25060 \
  -d defaultdb \
  -f zenpay_backup.sql
```

**Or using connection string:**
```bash
psql "postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require" -f zenpay_backup.sql
```

---

## Method 3: Using Prisma Migrate (Fresh Setup - Recommended)

If you're starting fresh or want to use Prisma migrations:

### Step 1: Update .env

```bash
DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

### Step 2: Generate Prisma Client

```bash
cd backend
npx prisma generate
```

### Step 3: Run Migrations

```bash
# This creates all tables from your Prisma schema
npx prisma migrate deploy
```

### Step 4: Seed Data (if you have seed file)

```bash
npx prisma db seed
```

---

## Method 4: Migrate Data Only (Keep Schema)

If you want to keep the Prisma schema but migrate existing data:

### Step 1: Create Schema with Prisma

```bash
npx prisma migrate deploy
```

### Step 2: Export Data Only from Old Database

```bash
# Export data only (no schema)
pg_dump -U your_username -h localhost -d your_database_name \
  --data-only \
  --column-inserts \
  -f zenpay_data_only.sql
```

### Step 3: Import Data to DigitalOcean

```bash
PGPASSWORD="YOUR_DATABASE_PASSWORD" psql \
  -U doadmin \
  -h zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com \
  -p 25060 \
  -d defaultdb \
  -f zenpay_data_only.sql
```

---

## 🔧 Complete Migration Script

Here's a complete script to automate the migration:

```bash
#!/bin/bash

# Configuration
OLD_DB_HOST="localhost"
OLD_DB_NAME="zenpay_db"
OLD_DB_USER="your_username"
NEW_DB_HOST="zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com"
NEW_DB_PORT="25060"
NEW_DB_NAME="defaultdb"
NEW_DB_USER="doadmin"
NEW_DB_PASSWORD="YOUR_DATABASE_PASSWORD"
DUMP_FILE="zenpay_migration_$(date +%Y%m%d_%H%M%S).dump"

echo "🔄 Starting database migration..."
echo "📦 Creating dump from old database..."

# Step 1: Create dump
pg_dump -U "$OLD_DB_USER" -h "$OLD_DB_HOST" -d "$OLD_DB_NAME" \
  -F c \
  -f "$DUMP_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Failed to create dump"
  exit 1
fi

echo "✅ Dump created: $DUMP_FILE"
echo "📤 Uploading to DigitalOcean..."

# Step 2: Restore to DigitalOcean
PGPASSWORD="$NEW_DB_PASSWORD" pg_restore \
  -U "$NEW_DB_USER" \
  -h "$NEW_DB_HOST" \
  -p "$NEW_DB_PORT" \
  -d "$NEW_DB_NAME" \
  --verbose \
  --no-owner \
  --no-acl \
  "$DUMP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Migration completed successfully!"
  echo "🗑️  Cleaning up dump file..."
  rm "$DUMP_FILE"
else
  echo "❌ Migration failed"
  echo "💾 Dump file preserved: $DUMP_FILE"
  exit 1
fi
```

**Save as `migrate-db.sh` and run:**
```bash
chmod +x migrate-db.sh
./migrate-db.sh
```

---

## 🪟 Windows PowerShell Script

For Windows users:

```powershell
# migrate-db.ps1

$OLD_DB_HOST = "localhost"
$OLD_DB_NAME = "zenpay_db"
$OLD_DB_USER = "your_username"
$NEW_DB_HOST = "zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com"
$NEW_DB_PORT = "25060"
$NEW_DB_NAME = "defaultdb"
$NEW_DB_USER = "doadmin"
$NEW_DB_PASSWORD = "YOUR_DATABASE_PASSWORD"
$DUMP_FILE = "zenpay_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

Write-Host "🔄 Starting database migration..." -ForegroundColor Cyan
Write-Host "📦 Creating dump from old database..." -ForegroundColor Yellow

# Create dump
pg_dump -U $OLD_DB_USER -h $OLD_DB_HOST -d $OLD_DB_NAME -F c -f $DUMP_FILE

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to create dump" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Dump created: $DUMP_FILE" -ForegroundColor Green
Write-Host "📤 Uploading to DigitalOcean..." -ForegroundColor Yellow

# Set password and restore
$env:PGPASSWORD = $NEW_DB_PASSWORD
pg_restore -U $NEW_DB_USER -h $NEW_DB_HOST -p $NEW_DB_PORT -d $NEW_DB_NAME --verbose --no-owner --no-acl $DUMP_FILE

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host "🗑️  Cleaning up dump file..." -ForegroundColor Yellow
    Remove-Item $DUMP_FILE
} else {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Write-Host "💾 Dump file preserved: $DUMP_FILE" -ForegroundColor Yellow
    exit 1
}
```

---

## 🔍 Verify Migration

After migration, verify your data:

```bash
# Connect to database
PGPASSWORD="YOUR_DATABASE_PASSWORD" psql \
  -U doadmin \
  -h zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com \
  -p 25060 \
  -d defaultdb

# Once connected, run:
\dt                    # List all tables
SELECT COUNT(*) FROM "User";     # Count users
SELECT COUNT(*) FROM "Employee"; # Count employees
SELECT COUNT(*) FROM "Payment";   # Count payments
\q                    # Quit
```

Or use the test script:
```bash
node test-db-connection.js
```

---

## ⚠️ Important Notes

### 1. **Database Name**
- DigitalOcean default database is `defaultdb`
- You can create a new database in DigitalOcean console if preferred
- Update connection string accordingly

### 2. **SSL Required**
- DigitalOcean managed databases **require SSL**
- Always include `?sslmode=require` in connection strings
- pg_restore/psql will use SSL automatically if available

### 3. **Permissions**
- Use `--no-owner` and `--no-acl` flags
- Managed databases handle permissions differently
- Don't try to restore ownership/permissions

### 4. **Large Databases**
- For large databases (>1GB), consider:
  - Using compression: `pg_dump -F c` (custom format is compressed)
  - Running during off-peak hours
  - Using `--jobs` flag for parallel restore: `pg_restore -j 4`

### 5. **Data Types & Extensions**
- Ensure all PostgreSQL extensions are available
- Check data types are compatible
- Prisma uses specific naming conventions

---

## 🐛 Troubleshooting

### Error: "connection refused"
- ✅ Check Trusted Sources in DigitalOcean dashboard
- ✅ Add your IP address to allowed sources
- ✅ Verify host and port are correct

### Error: "authentication failed"
- ✅ Verify password (including spaces - URL encode as `%20`)
- ✅ Check username is `doadmin`
- ✅ Ensure database name is correct

### Error: "relation already exists"
- ✅ Database already has tables
- ✅ Use `--clean` flag: `pg_restore --clean ...`
- ✅ Or drop existing tables first

### Error: "permission denied"
- ✅ Use `--no-owner` and `--no-acl` flags
- ✅ Managed databases handle permissions automatically

### Error: "SSL required"
- ✅ Add `?sslmode=require` to connection string
- ✅ Or set: `export PGSSLMODE=require`

---

## ✅ Migration Checklist

- [ ] Backup created from source database
- [ ] DigitalOcean database cluster created
- [ ] Connection string configured
- [ ] Trusted Sources configured
- [ ] Dump file created successfully
- [ ] Migration command executed
- [ ] Data verified in new database
- [ ] Application tested with new database
- [ ] Old database backup preserved

---

## 🚀 After Migration

1. **Update Application**
   ```bash
   # Update .env with new DATABASE_URL
   DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
   ```

2. **Test Connection**
   ```bash
   node test-db-connection.js
   ```

3. **Run Prisma Generate** (if using Prisma)
   ```bash
   npx prisma generate
   ```

4. **Start Application**
   ```bash
   npm start
   ```

5. **Monitor Database**
   - Check DigitalOcean dashboard for metrics
   - Monitor connection count
   - Watch for any errors

---

**Your database migration is complete! 🎉**


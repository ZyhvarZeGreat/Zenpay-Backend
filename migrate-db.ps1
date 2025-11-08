# Database Migration Script for DigitalOcean PostgreSQL (PowerShell)
# Migrates data from existing database to DigitalOcean managed PostgreSQL

# Configuration - UPDATE THESE VALUES
$OLD_DB_HOST = "localhost"
$OLD_DB_NAME = "zenpay_db"
$OLD_DB_USER = "postgres"
$NEW_DB_HOST = "zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com"
$NEW_DB_PORT = "25060"
$NEW_DB_NAME = "defaultdb"
$NEW_DB_USER = "doadmin"
$NEW_DB_PASSWORD = $env:DO_DB_PASSWORD
if (-not $NEW_DB_PASSWORD) {
    Write-Host "❌ DO_DB_PASSWORD environment variable not set!" -ForegroundColor Red
    Write-Host "   Set it with: `$env:DO_DB_PASSWORD = 'YOUR_PASSWORD'" -ForegroundColor Yellow
    exit 1
}
$DUMP_FILE = "zenpay_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

Write-Host "🔄 Starting database migration..." -ForegroundColor Cyan
Write-Host ""

# Check if pg_dump is available
try {
    $null = Get-Command pg_dump -ErrorAction Stop
} catch {
    Write-Host "❌ pg_dump not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "   Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Check if pg_restore is available
try {
    $null = Get-Command pg_restore -ErrorAction Stop
} catch {
    Write-Host "❌ pg_restore not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "   Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Step 1: Create dump from old database
Write-Host "📦 Step 1: Creating dump from source database..." -ForegroundColor Yellow
Write-Host "   Host: $OLD_DB_HOST"
Write-Host "   Database: $OLD_DB_NAME"
Write-Host "   User: $OLD_DB_USER"
Write-Host ""

$dumpProcess = Start-Process -FilePath "pg_dump" -ArgumentList @(
    "-U", $OLD_DB_USER,
    "-h", $OLD_DB_HOST,
    "-d", $OLD_DB_NAME,
    "-F", "c",
    "-f", $DUMP_FILE,
    "--verbose"
) -Wait -PassThru -NoNewWindow

if ($dumpProcess.ExitCode -ne 0) {
    Write-Host "❌ Failed to create dump" -ForegroundColor Red
    Write-Host "   Please check:" -ForegroundColor Yellow
    Write-Host "   - Database connection details" -ForegroundColor Yellow
    Write-Host "   - User permissions" -ForegroundColor Yellow
    Write-Host "   - Database exists" -ForegroundColor Yellow
    exit 1
}

# Check if dump file was created
if (-not (Test-Path $DUMP_FILE)) {
    Write-Host "❌ Dump file was not created" -ForegroundColor Red
    exit 1
}

$dumpSize = (Get-Item $DUMP_FILE).Length / 1MB
Write-Host "✅ Dump created successfully!" -ForegroundColor Green
Write-Host "   File: $DUMP_FILE"
Write-Host "   Size: $([math]::Round($dumpSize, 2)) MB"
Write-Host ""

# Step 2: Restore to DigitalOcean
Write-Host "📤 Step 2: Restoring to DigitalOcean PostgreSQL..." -ForegroundColor Yellow
Write-Host "   Host: $NEW_DB_HOST"
Write-Host "   Port: $NEW_DB_PORT"
Write-Host "   Database: $NEW_DB_NAME"
Write-Host "   User: $NEW_DB_USER"
Write-Host ""

$env:PGPASSWORD = $NEW_DB_PASSWORD

$restoreProcess = Start-Process -FilePath "pg_restore" -ArgumentList @(
    "-U", $NEW_DB_USER,
    "-h", $NEW_DB_HOST,
    "-p", $NEW_DB_PORT,
    "-d", $NEW_DB_NAME,
    "--verbose",
    "--no-owner",
    "--no-acl",
    $DUMP_FILE
) -Wait -PassThru -NoNewWindow

$restoreExitCode = $restoreProcess.ExitCode
$env:PGPASSWORD = $null

if ($restoreExitCode -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Verifying migration..." -ForegroundColor Cyan
    
    # Quick verification
    $env:PGPASSWORD = $NEW_DB_PASSWORD
    $tableCount = & psql -U $NEW_DB_USER -h $NEW_DB_HOST -p $NEW_DB_PORT -d $NEW_DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null | ForEach-Object { $_.Trim() }
    $env:PGPASSWORD = $null
    
    if ($tableCount) {
        Write-Host "   Tables migrated: $tableCount" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "🗑️  Cleaning up dump file..." -ForegroundColor Yellow
    Remove-Item $DUMP_FILE
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 Migration successful!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Update DATABASE_URL in your .env file"
    Write-Host "2. Test connection: node test-db-connection.js"
    Write-Host "3. Start your application"
} else {
    Write-Host ""
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check Trusted Sources in DigitalOcean dashboard"
    Write-Host "2. Verify connection details"
    Write-Host "3. Check database permissions"
    Write-Host ""
    Write-Host "💾 Dump file preserved: $DUMP_FILE" -ForegroundColor Yellow
    Write-Host "   You can retry the restore manually:"
    Write-Host "   `$env:PGPASSWORD=`"$NEW_DB_PASSWORD`"; pg_restore -U $NEW_DB_USER -h $NEW_DB_HOST -p $NEW_DB_PORT -d $NEW_DB_NAME --verbose --no-owner --no-acl $DUMP_FILE"
    exit 1
}


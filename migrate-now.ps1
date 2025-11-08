# Quick Migration Script for Windows PowerShell
# Uses your local database: zenpay_dev

$LOCAL_DB_HOST = "localhost"
$LOCAL_DB_PORT = "5432"
$LOCAL_DB_NAME = "zenpay_dev"
$LOCAL_DB_USER = "postgres"
$LOCAL_DB_PASSWORD = "admin"

$DO_DB_HOST = "zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com"
$DO_DB_PORT = "25060"
$DO_DB_NAME = "defaultdb"
$DO_DB_USER = "doadmin"
$DO_DB_PASSWORD = $env:DO_DB_PASSWORD
if (-not $DO_DB_PASSWORD) {
    Write-Host "❌ DO_DB_PASSWORD environment variable not set!" -ForegroundColor Red
    Write-Host "   Set it with: `$env:DO_DB_PASSWORD = 'YOUR_PASSWORD'" -ForegroundColor Yellow
    exit 1
}

$DUMP_FILE = "zenpay_migration_$(Get-Date -Format 'yyyyMMdd_HHmmss').dump"

Write-Host "🔄 Starting Database Migration" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if pg_dump is available
try {
    $null = Get-Command pg_dump -ErrorAction Stop
    Write-Host "✅ pg_dump found" -ForegroundColor Green
} catch {
    Write-Host "❌ pg_dump not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "   Download: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "   Or use portable: https://www.enterprisedb.com/download-postgresql-binaries" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "After installation, add PostgreSQL bin folder to PATH:" -ForegroundColor Yellow
    Write-Host "   Usually: C:\Program Files\PostgreSQL\15\bin" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📦 Step 1: Creating dump from local database..." -ForegroundColor Yellow
Write-Host "   Source: $LOCAL_DB_HOST`:$LOCAL_DB_PORT/$LOCAL_DB_NAME" -ForegroundColor Gray
Write-Host ""

$env:PGPASSWORD = $LOCAL_DB_PASSWORD

try {
    pg_dump -U $LOCAL_DB_USER `
        -h $LOCAL_DB_HOST `
        -p $LOCAL_DB_PORT `
        -d $LOCAL_DB_NAME `
        -F c `
        -f $DUMP_FILE `
        --verbose

    if ($LASTEXITCODE -ne 0) {
        throw "pg_dump failed"
    }

    $dumpSize = (Get-Item $DUMP_FILE).Length / 1MB
    Write-Host ""
    Write-Host "✅ Dump created successfully!" -ForegroundColor Green
    Write-Host "   File: $DUMP_FILE" -ForegroundColor Gray
    Write-Host "   Size: $([math]::Round($dumpSize, 2)) MB" -ForegroundColor Gray
} catch {
    Write-Host ""
    Write-Host "❌ Failed to create dump" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check if PostgreSQL is running" -ForegroundColor Yellow
    Write-Host "   2. Verify database credentials" -ForegroundColor Yellow
    Write-Host "   3. Ensure database '$LOCAL_DB_NAME' exists" -ForegroundColor Yellow
    exit 1
} finally {
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "📤 Step 2: Restoring to DigitalOcean..." -ForegroundColor Yellow
Write-Host "   Target: $DO_DB_HOST`:$DO_DB_PORT/$DO_DB_NAME" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  IMPORTANT: Make sure your IP is added to Trusted Sources in DigitalOcean!" -ForegroundColor Yellow
Write-Host ""

$confirm = Read-Host "Continue? (yes/no)"
if ($confirm -ne "yes" -and $confirm -ne "y") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

$env:PGPASSWORD = $DO_DB_PASSWORD

try {
    pg_restore -U $DO_DB_USER `
        -h $DO_DB_HOST `
        -p $DO_DB_PORT `
        -d $DO_DB_NAME `
        --verbose `
        --no-owner `
        --no-acl `
        $DUMP_FILE

    if ($LASTEXITCODE -ne 0) {
        throw "pg_restore failed"
    }

    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Check Trusted Sources in DigitalOcean dashboard" -ForegroundColor Yellow
    Write-Host "   2. Add your current IP address" -ForegroundColor Yellow
    Write-Host "   3. Verify connection details" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💾 Dump file preserved: $DUMP_FILE" -ForegroundColor Yellow
    exit 1
} finally {
    $env:PGPASSWORD = $null
}

Write-Host ""
Write-Host "🔍 Step 3: Verifying migration..." -ForegroundColor Yellow

$env:PGPASSWORD = $DO_DB_PASSWORD
try {
    $tableCount = psql -U $DO_DB_USER -h $DO_DB_HOST -p $DO_DB_PORT -d $DO_DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>$null | ForEach-Object { $_.Trim() }
    if ($tableCount) {
        Write-Host "   ✅ Tables migrated: $tableCount" -ForegroundColor Green
    }
} catch {
    Write-Host "   ⚠️  Could not verify automatically" -ForegroundColor Yellow
}
$env:PGPASSWORD = $null

Write-Host ""
$cleanup = Read-Host "🗑️  Delete dump file? (yes/no, default: yes)"
if ($cleanup -ne "no" -and $cleanup -ne "n") {
    Remove-Item $DUMP_FILE
    Write-Host "✅ Dump file deleted" -ForegroundColor Green
} else {
    Write-Host "💾 Dump file preserved: $DUMP_FILE" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Migration Complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "   1. Update DATABASE_URL in .env file:" -ForegroundColor White
Write-Host "      DATABASE_URL=`"postgresql://doadmin:YOUR_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require`"" -ForegroundColor Gray
Write-Host "   2. Test connection: node test-db-connection.js" -ForegroundColor White
Write-Host "   3. Start your application: npm start" -ForegroundColor White
Write-Host ""


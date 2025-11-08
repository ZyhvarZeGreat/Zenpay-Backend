# 🔄 Migrate Local Database to DigitalOcean

Step-by-step guide to migrate your local PostgreSQL database to DigitalOcean.

## 📋 Prerequisites

You need PostgreSQL client tools installed. Choose one method below:

### Option A: Install PostgreSQL Client Tools

**Windows:**
1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. During installation, make sure to install "Command Line Tools"
3. Or use the portable version: https://www.enterprisedb.com/download-postgresql-binaries

**macOS:**
```bash
brew install postgresql
```

**Linux:**
```bash
sudo apt-get install postgresql-client
# or
sudo yum install postgresql
```

### Option B: Use Docker (If you have Docker)

If you're using Docker for your local database, you can use Docker to run pg_dump:

```bash
docker run --rm -v $(pwd):/backup postgres:15 pg_dump -h host.docker.internal -U your_user -d your_db -F c -f /backup/zenpay_backup.dump
```

---

## 🚀 Quick Migration (Automated)

### Step 1: Run the Migration Script

```bash
cd backend
node migrate-local-db.js
```

The script will:
- Ask for your local database details
- Create a dump file
- Restore it to DigitalOcean
- Verify the migration

---

## 📝 Manual Migration Steps

### Step 1: Get Your Local Database Details

You'll need:
- **Host**: Usually `localhost` or `127.0.0.1`
- **Port**: Usually `5432`
- **Database Name**: Your database name
- **Username**: Your database user
- **Password**: Your database password

**If using Docker Compose:**
- Check your `docker-compose.yml` for database details
- Default might be: `zenpay_db`, `zenpay_user`

**If using local PostgreSQL:**
- Check your `.env` file for `DATABASE_URL`
- Or check PostgreSQL config

### Step 2: Create Database Dump

```bash
# Replace with your actual values
pg_dump -U your_username \
  -h localhost \
  -p 5432 \
  -d your_database_name \
  -F c \
  -f zenpay_backup.dump \
  --verbose
```

**Example:**
```bash
pg_dump -U postgres -h localhost -p 5432 -d zenpay_db -F c -f zenpay_backup.dump --verbose
```

**If password is required:**
```bash
# Windows (PowerShell)
$env:PGPASSWORD="your_password"
pg_dump -U your_username -h localhost -p 5432 -d your_database_name -F c -f zenpay_backup.dump

# Linux/Mac
PGPASSWORD="your_password" pg_dump -U your_username -h localhost -p 5432 -d your_database_name -F c -f zenpay_backup.dump
```

### Step 3: Restore to DigitalOcean

**Important:** First, add your IP to Trusted Sources in DigitalOcean dashboard!

```bash
# Windows (PowerShell)
$env:PGPASSWORD="YOUR_DATABASE_PASSWORD"
pg_restore -U doadmin -h zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com -p 25060 -d defaultdb --verbose --no-owner --no-acl zenpay_backup.dump

# Linux/Mac
PGPASSWORD="YOUR_DATABASE_PASSWORD" pg_restore -U doadmin -h zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com -p 25060 -d defaultdb --verbose --no-owner --no-acl zenpay_backup.dump
```

### Step 4: Verify Migration

```bash
# Test connection
node test-db-connection.js

# Or manually check tables
PGPASSWORD="YOUR_DATABASE_PASSWORD" psql -U doadmin -h zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com -p 25060 -d defaultdb -c "\dt"
```

---

## 🐳 If Using Docker for Local Database

### Method 1: Dump from Docker Container

```bash
# Get your container name
docker ps

# Create dump from container
docker exec zenpay-postgres pg_dump -U zenpay_user -d zenpay_db -F c > zenpay_backup.dump
```

### Method 2: Connect to Docker Database

If your Docker database is exposed on localhost:5432:

```bash
# Just use localhost as host
pg_dump -U zenpay_user -h localhost -p 5432 -d zenpay_db -F c -f zenpay_backup.dump
```

---

## 🔍 Find Your Local Database Details

### Check .env File

```bash
# Look for DATABASE_URL
cat .env | grep DATABASE_URL
```

Example formats:
- `postgresql://user:password@localhost:5432/dbname`
- `postgresql://zenpay_user:password@localhost:5432/zenpay_db`

### Check Docker Compose

```bash
cat docker-compose.yml | grep -A 10 postgres
```

Look for:
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

### Check Running Containers

```bash
docker ps
docker inspect zenpay-postgres | grep -i postgres
```

---

## ⚠️ Important: Trusted Sources

**Before migrating, you MUST add your IP to DigitalOcean Trusted Sources:**

1. Go to DigitalOcean Dashboard
2. Click on your database cluster
3. Go to **Settings** → **Trusted Sources**
4. Click **Add Trusted Source**
5. Add your current IP address
6. Or select "All Droplets" if migrating from a Droplet

**Without this, the connection will be refused!**

---

## 🐛 Troubleshooting

### Error: "pg_dump: command not found"
- Install PostgreSQL client tools (see Prerequisites)

### Error: "connection refused"
- Check Trusted Sources in DigitalOcean
- Verify your IP is added
- Check firewall settings

### Error: "authentication failed"
- Verify password is correct
- Check username matches
- Ensure database exists

### Error: "relation already exists"
- Database already has tables
- Use `--clean` flag: `pg_restore --clean ...`
- Or drop existing tables first

### Error: "permission denied"
- Use `--no-owner` and `--no-acl` flags
- Managed databases handle permissions automatically

---

## ✅ After Migration

1. **Update .env file:**
   ```bash
   DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
   ```

2. **Test connection:**
   ```bash
   node test-db-connection.js
   ```

3. **Start your application:**
   ```bash
   npm start
   ```

---

## 🆘 Need Help?

If you're stuck, provide:
- Your local database type (Docker, local PostgreSQL, etc.)
- Your DATABASE_URL or connection details
- Any error messages you're seeing

---

**Ready to migrate? Run: `node migrate-local-db.js`** 🚀


# 🗄️ DigitalOcean PostgreSQL Database Setup Guide

Complete guide for setting up and configuring PostgreSQL database on DigitalOcean for Zenpay backend.

## 📋 Quick Steps Overview

1. Create Database Cluster
2. Configure Database Settings
3. Get Connection String
4. Connect to Your App
5. Run Migrations
6. Verify Connection

---

## Step 1: Create Database Cluster

### Via DigitalOcean Console

1. **Log in to DigitalOcean**
   - Go to [https://cloud.digitalocean.com](https://cloud.digitalocean.com)
   - Sign in to your account

2. **Navigate to Databases**
   - Click **Databases** in the left sidebar
   - Click **Create Database Cluster** button

3. **Choose Database Engine**
   - Select **PostgreSQL**
   - Choose version: **PostgreSQL 15** (recommended) or **PostgreSQL 14**

4. **Select Plan**
   - **Dev/Test**: Basic - $7/month (1GB RAM, 1 vCPU, 10GB storage)
   - **Production**: Basic - $15/month (1GB RAM, 1 vCPU, 25GB storage)
   - **High Traffic**: Professional - $60/month (2GB RAM, 1 vCPU, 25GB storage)
   
   💡 **Recommendation**: Start with Dev ($7/mo) for testing, upgrade to Basic ($15/mo) for production

5. **Choose Datacenter Region**
   - Select the region closest to your users or app
   - **Important**: Choose the same region as your app for best performance
   - Popular choices: `NYC1`, `SFO3`, `AMS3`, `SGP1`

6. **Configure Database**
   - **Database Name**: `zenpay_db` (or your preferred name)
   - **Database User**: `zenpay_user` (or your preferred username)
   - **Note**: Password will be auto-generated (save it!)

7. **Additional Options** (Optional)
   - **Backups**: Enable daily backups (recommended for production)
   - **Maintenance Window**: Choose a time when traffic is low
   - **Tags**: Add tags like `production`, `backend`, `zenpay` for organization

8. **Create Database**
   - Review your settings
   - Click **Create Database Cluster**
   - Wait 3-5 minutes for provisioning

---

## Step 2: Get Connection Details

Once your database is created:

1. **Click on your database cluster** to open details

2. **Go to "Connection Details" tab**

3. **You'll see:**
   - **Host**: `your-db-do-user-xxxxx-0.db.ondigitalocean.com`
   - **Port**: `25060` (default for managed databases)
   - **Database**: `zenpay_db`
   - **User**: `zenpay_user`
   - **Password**: Click "Show" to reveal (save this!)
   - **SSL Mode**: `require` (always use SSL for managed databases)

4. **Connection String Format:**
   ```
   postgresql://zenpay_user:YOUR_PASSWORD@your-db-do-user-xxxxx-0.db.ondigitalocean.com:25060/zenpay_db?sslmode=require
   ```

5. **Save these details securely!** You'll need them for your `.env` file

---

## Step 3: Configure Database Access

### Option A: Trusted Sources (Recommended for App Platform)

1. Go to **Settings** → **Trusted Sources**
2. Click **Add Trusted Source**
3. Select:
   - **App Platform** (if using App Platform)
   - Or add specific IP addresses
4. For Droplets: Add your Droplet's IP address

### Option B: VPC Network (Recommended for Droplets)

1. Go to **Settings** → **VPC**
2. If your Droplet is in a VPC, select the same VPC
3. This allows private network communication (more secure)

---

## Step 4: Connect Database to Your App

### If Using App Platform:

1. **In App Platform Dashboard:**
   - Go to your app → **Settings** → **Components**
   - Click on your backend component
   - Scroll to **Database** section
   - Click **Attach Database**
   - Select your PostgreSQL cluster
   - The `DATABASE_URL` will be auto-injected as `${db.DATABASE_URL}`

2. **Environment Variable:**
   - The connection string is automatically available as `DATABASE_URL`
   - No need to manually add it!

### If Using Droplet or Manual Setup:

1. **Add to `.env` file:**
   ```bash
   DATABASE_URL="postgresql://zenpay_user:YOUR_PASSWORD@your-db-do-user-xxxxx-0.db.ondigitalocean.com:25060/zenpay_db?sslmode=require"
   ```

2. **Or use connection pooling (recommended):**
   ```bash
   DATABASE_URL="postgresql://zenpay_user:YOUR_PASSWORD@your-db-do-user-xxxxx-0.db.ondigitalocean.com:25060/zenpay_db?sslmode=require&connection_limit=10"
   ```

---

## Step 5: Run Database Migrations

### On App Platform:
Migrations run automatically during build if you have:
```bash
npx prisma migrate deploy
```
in your build command.

### On Droplet/Manual:
```bash
# SSH into your server
ssh root@YOUR_DROPLET_IP

# Navigate to backend
cd /path/to/zenpay/backend

# Run migrations
npm install
npx prisma generate
npx prisma migrate deploy
```

---

## Step 6: Verify Connection

### Test from your local machine:
```bash
# Install psql (if not installed)
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client

# Connect to database
psql "postgresql://zenpay_user:YOUR_PASSWORD@your-db-do-user-xxxxx-0.db.ondigitalocean.com:25060/zenpay_db?sslmode=require"

# Once connected, test:
\dt  # List tables
\q   # Quit
```

### Test from your backend:
```bash
# In your backend directory
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\$connect()
  .then(() => console.log('✅ Database connected!'))
  .catch(err => console.error('❌ Connection failed:', err))
  .finally(() => prisma.\$disconnect());
"
```

### Test via API:
```bash
# After deploying, test health endpoint
curl https://your-api-url.com/health
```

---

## Step 7: Database Management

### View Database Metrics:
- Go to your database cluster → **Metrics** tab
- Monitor: CPU, Memory, Disk Usage, Connections

### Access Database Console:
- Go to your database cluster → **Overview** tab
- Click **Launch Console** (opens web-based SQL editor)

### Backup & Restore:
- **Automatic Backups**: Enabled by default (daily)
- **Manual Backup**: Go to **Backups** tab → **Take Snapshot**
- **Restore**: Go to **Backups** tab → Select backup → **Restore**

---

## 🔒 Security Best Practices

1. **Always use SSL**: Managed databases require SSL (`sslmode=require`)
2. **Use Connection Pooling**: Prevents too many connections
3. **Limit Trusted Sources**: Only allow your app's IP addresses
4. **Rotate Passwords**: Change database password regularly
5. **Enable Backups**: Always have backups enabled for production
6. **Monitor Connections**: Set connection limits to prevent overload

---

## 💰 Cost Optimization

### Development/Testing:
- Use **Dev Plan** ($7/month)
- 1GB RAM, 10GB storage
- Perfect for testing and staging

### Production:
- Use **Basic Plan** ($15/month)
- 1GB RAM, 25GB storage
- Can handle moderate traffic

### High Traffic:
- Use **Professional Plan** ($60/month)
- 2GB RAM, 25GB storage
- Better performance for high traffic

### Scaling Tips:
- Start small, scale up as needed
- Monitor usage in Metrics tab
- Upgrade when you hit 80% capacity

---

## 🐛 Troubleshooting

### Connection Refused:
- ✅ Check Trusted Sources includes your app's IP
- ✅ Verify SSL mode is `require`
- ✅ Check firewall rules

### Authentication Failed:
- ✅ Verify username and password
- ✅ Check database name is correct
- ✅ Ensure user has proper permissions

### Too Many Connections:
- ✅ Use connection pooling
- ✅ Reduce connection pool size
- ✅ Upgrade database plan

### Migration Errors:
- ✅ Ensure Prisma Client is generated: `npx prisma generate`
- ✅ Check database user has CREATE TABLE permissions
- ✅ Verify DATABASE_URL is correct

---

## 📝 Example .env Configuration

```bash
# Database (DigitalOcean Managed PostgreSQL)
DATABASE_URL="postgresql://zenpay_user:YOUR_PASSWORD@your-db-do-user-xxxxx-0.db.ondigitalocean.com:25060/zenpay_db?sslmode=require&connection_limit=10"

# Or for App Platform (auto-injected):
# DATABASE_URL=${db.DATABASE_URL}
```

---

## ✅ Checklist

- [ ] Database cluster created
- [ ] Connection details saved
- [ ] Trusted sources configured
- [ ] DATABASE_URL added to environment variables
- [ ] Migrations run successfully
- [ ] Connection tested and verified
- [ ] Backups enabled
- [ ] Monitoring set up

---

## 🆘 Need Help?

- **DigitalOcean Docs**: [PostgreSQL Setup](https://docs.digitalocean.com/products/databases/postgresql/)
- **Support**: DigitalOcean Support Chat
- **Status**: [status.digitalocean.com](https://status.digitalocean.com)

---

**Your database is now ready! 🎉**

Next steps:
1. Connect it to your backend app
2. Run migrations
3. Start using your API!


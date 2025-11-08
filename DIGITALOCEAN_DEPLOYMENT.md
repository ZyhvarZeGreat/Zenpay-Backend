# 🌊 DigitalOcean Deployment Guide - Zenpay Backend

Complete guide for deploying Zenpay backend on DigitalOcean.

## 📋 Table of Contents

1. [App Platform (Easiest)](#option-1-app-platform-easiest)
2. [Droplet + Docker (Recommended)](#option-2-droplet--docker-recommended)
3. [Droplet Manual Setup](#option-3-droplet-manual-setup)
4. [Database Setup](#database-setup)
5. [Domain & SSL](#domain--ssl-setup)
6. [Monitoring](#monitoring--maintenance)

---

## Option 1: App Platform (Easiest) ⚡

DigitalOcean App Platform is like Heroku - fully managed, auto-scaling, zero DevOps.

### Step 1: Create Database

1. Go to [DigitalOcean Console](https://cloud.digitalocean.com)
2. Click **Databases** → **Create Database Cluster**
3. Settings:
   - **Database Engine**: PostgreSQL 15
   - **Plan**: Basic ($15/month) or Dev ($7/month for testing)
   - **Datacenter**: Choose closest to your users
   - **Database Name**: `zenpay_db`
   - **User**: `zenpay_user`
4. Click **Create Database Cluster**
5. Wait 3-5 minutes for provisioning
6. **Save the connection details** (you'll need them)

### Step 2: Deploy App

1. Click **Apps** → **Create App**
2. **Source**: Connect your GitHub repository
3. **Repository**: Select your Zenpay repo
4. **Branch**: `main`
5. **Source Directory**: `/backend`
6. Click **Next**

### Step 3: Configure Build Settings

**Detected**: Node.js (auto-detected)

**Build Command**:
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

**Run Command**:
```bash
npm start
```

**HTTP Port**: `5000`

Click **Next**

### Step 4: Add Environment Variables

Click **Edit** next to your app component, then **Environment Variables**:

```bash
# Required
NODE_ENV=production
PORT=5000
DATABASE_URL=${db.DATABASE_URL}

# Generate these (see below)
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>

# JWT Settings
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Blockchain (Update with your values)
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ETHEREUM_CHAIN_ID=1
MNEMONIC=your twelve word mnemonic phrase goes here

# Smart Contracts (Update with your addresses)
ETH_EMPLOYEE_REGISTRY=0x0000000000000000000000000000000000000000
ETH_INVOICE_MANAGER=0x0000000000000000000000000000000000000000
ETH_PAYMENT_APPROVAL=0x0000000000000000000000000000000000000000
ETH_CORE_PAYROLL=0x0000000000000000000000000000000000000000

# Frontend URL (Update after frontend deployment)
FRONTEND_URL=https://your-frontend.com

# Optional
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Generate Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 5: Connect Database

1. Scroll to **Database**
2. Click **Attach Database**
3. Select your PostgreSQL cluster
4. The `DATABASE_URL` will be auto-injected as `${db.DATABASE_URL}`

### Step 6: Configure Resources

**Instance Size**:
- **Dev/Testing**: Basic ($5/month) - 512MB RAM
- **Production**: Professional ($12/month) - 1GB RAM
- **High Traffic**: Professional Plus ($24/month) - 2GB RAM

**Instance Count**: 1 (can scale later)

Click **Next**

### Step 7: Review & Launch

1. Review all settings
2. **App Name**: `zenpay-backend`
3. **Region**: Same as database
4. Click **Create Resources**

### Step 8: Wait for Deployment

- First deployment takes 5-10 minutes
- Watch the build logs in real-time
- App Platform will run migrations automatically

### Step 9: Get Your URL

Once deployed:
- Your API will be at: `https://zenpay-backend-xxxxx.ondigitalocean.app`
- Test it: `https://zenpay-backend-xxxxx.ondigitalocean.app/health`

### Step 10: Add Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `api.yourdomain.com`
4. Add CNAME record to your DNS:
   ```
   CNAME api zenpay-backend-xxxxx.ondigitalocean.app
   ```
5. SSL certificate auto-generated!

---

## Option 2: Droplet + Docker (Recommended) 🐳

Best for full control, cost-effective, and scalable.

### Step 1: Create Droplet

1. Click **Droplets** → **Create Droplet**
2. **Image**: Docker on Ubuntu 22.04
3. **Plan**: 
   - **Dev**: Basic $6/month (1GB RAM)
   - **Production**: Basic $12/month (2GB RAM)
   - **High Traffic**: Basic $24/month (4GB RAM)
4. **Datacenter**: Choose closest region
5. **Authentication**: SSH Key (recommended) or Password
6. **Hostname**: `zenpay-backend`
7. Click **Create Droplet**

### Step 2: Connect to Droplet

```bash
# Get your droplet IP from DigitalOcean dashboard
ssh root@YOUR_DROPLET_IP
```

### Step 3: Setup PostgreSQL Database

**Option A: Managed Database (Recommended)**
- Use DigitalOcean Managed Database (see Step 1 from App Platform)
- More reliable, automated backups, easy scaling

**Option B: Self-Hosted on Droplet**
```bash
# Install PostgreSQL
apt update && apt upgrade -y
apt install -y postgresql postgresql-contrib

# Setup database
sudo -u postgres psql

CREATE DATABASE zenpay_db;
CREATE USER zenpay_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE zenpay_db TO zenpay_user;
\q

# Allow remote connections (if using managed DB, skip this)
nano /etc/postgresql/14/main/postgresql.conf
# Change: listen_addresses = '*'

nano /etc/postgresql/14/main/pg_hba.conf
# Add: host all all 0.0.0.0/0 md5

systemctl restart postgresql
```

### Step 4: Clone Repository

```bash
# Install git if not present
apt install -y git

# Clone your repository
cd /opt
git clone https://github.com/yourusername/zenpay.git
cd zenpay/backend
```

### Step 5: Create Environment File

```bash
nano .env
```

Paste your environment variables:
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://zenpay_user:your_password@localhost:5432/zenpay_db?schema=public"

# Or if using managed database:
# DATABASE_URL="postgresql://zenpay_user:password@db-postgresql-nyc1-12345.ondigitalocean.com:25060/zenpay_db?sslmode=require"

JWT_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
ETHEREUM_CHAIN_ID=1
MNEMONIC=your twelve word mnemonic phrase

ETH_EMPLOYEE_REGISTRY=0x...
ETH_INVOICE_MANAGER=0x...
ETH_PAYMENT_APPROVAL=0x...
ETH_CORE_PAYROLL=0x...

FRONTEND_URL=https://your-frontend.com
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

Save and exit (Ctrl+X, Y, Enter)

### Step 6: Build and Run Docker Container

```bash
# Build the image
docker build -t zenpay-backend .

# Run the container
docker run -d \
  --name zenpay-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  zenpay-backend

# Check if it's running
docker ps

# View logs
docker logs -f zenpay-backend
```

### Step 7: Setup Nginx Reverse Proxy

```bash
# Install Nginx
apt install -y nginx

# Create Nginx config
nano /etc/nginx/sites-available/zenpay
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # Change this

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/zenpay /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 8: Setup SSL with Let's Encrypt

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
certbot renew --dry-run
```

### Step 9: Setup Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
ufw status
```

### Step 10: Setup Automatic Updates

```bash
# Create update script
nano /opt/update-zenpay.sh
```

```bash
#!/bin/bash
cd /opt/zenpay/backend
git pull origin main
docker build -t zenpay-backend .
docker stop zenpay-backend
docker rm zenpay-backend
docker run -d \
  --name zenpay-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  zenpay-backend
```

```bash
chmod +x /opt/update-zenpay.sh
```

To update:
```bash
/opt/update-zenpay.sh
```

---

## Option 3: Droplet Manual Setup 🔧

Without Docker, traditional Node.js deployment.

### Step 1-2: Same as Option 2

Create droplet and connect via SSH.

### Step 3: Install Node.js

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Verify
node --version  # Should be v18.x
npm --version
```

### Step 4: Install PostgreSQL

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Setup database (same as Option 2)
sudo -u postgres psql
CREATE DATABASE zenpay_db;
CREATE USER zenpay_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zenpay_db TO zenpay_user;
\q
```

### Step 5: Clone and Setup Application

```bash
# Clone repository
cd /opt
git clone https://github.com/yourusername/zenpay.git
cd zenpay/backend

# Install dependencies
npm install

# Create .env file (same as Option 2)
nano .env
# Paste your environment variables

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy
```

### Step 6: Install PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start src/index.js --name zenpay-backend

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs

# Check status
pm2 status
pm2 logs zenpay-backend
```

### Step 7: Setup Nginx & SSL

Same as Option 2, Steps 7-8.

### Step 8: PM2 Management Commands

```bash
# View logs
pm2 logs zenpay-backend

# Restart
pm2 restart zenpay-backend

# Stop
pm2 stop zenpay-backend

# Monitor
pm2 monit

# Update application
cd /opt/zenpay/backend
git pull origin main
npm install
npx prisma migrate deploy
pm2 restart zenpay-backend
```

---

## Database Setup 💾

### Using Managed Database (Recommended)

**Advantages:**
- Automated backups
- High availability
- Easy scaling
- Automatic updates
- Point-in-time recovery

**Steps:**
1. Create database cluster (see Option 1, Step 1)
2. Get connection string from dashboard
3. Add to your `.env` file
4. Connection string format:
   ```
   postgresql://username:password@host:port/database?sslmode=require
   ```

### Database Backups

**Managed Database**: Automatic daily backups

**Self-Hosted**:
```bash
# Manual backup
pg_dump -h localhost -U zenpay_user -d zenpay_db > backup.sql

# Automated daily backups
crontab -e

# Add this line (backup at 2 AM daily)
0 2 * * * pg_dump -h localhost -U zenpay_user -d zenpay_db > /backups/zenpay_$(date +\%Y\%m\%d).sql
```

---

## Domain & SSL Setup 🔐

### Step 1: Point Domain to Droplet

In your domain registrar (Namecheap, GoDaddy, etc.):

```
Type: A Record
Name: api
Value: YOUR_DROPLET_IP
TTL: 300
```

Or use DigitalOcean DNS:
1. Go to **Networking** → **Domains**
2. Add your domain
3. Create A record pointing to droplet IP

### Step 2: Install SSL Certificate

```bash
# Using Certbot (free)
certbot --nginx -d api.yourdomain.com

# Certificate auto-renews every 90 days
```

---

## Monitoring & Maintenance 📊

### View Application Logs

**Docker**:
```bash
docker logs -f zenpay-backend
docker logs --tail 100 zenpay-backend
```

**PM2**:
```bash
pm2 logs zenpay-backend
pm2 logs --lines 100
```

### Monitor Resources

```bash
# CPU and Memory
htop

# Docker stats
docker stats zenpay-backend

# Disk usage
df -h

# Network
netstat -tuln | grep 5000
```

### Setup Monitoring (Optional)

**DigitalOcean Monitoring** (Free):
1. Enable on droplet
2. View metrics in dashboard
3. Setup alerts

**External Monitoring**:
- [UptimeRobot](https://uptimerobot.com) - Free uptime monitoring
- [Better Uptime](https://betteruptime.com) - Status pages
- [Sentry](https://sentry.io) - Error tracking

### Automatic Security Updates

```bash
# Enable unattended upgrades
apt install -y unattended-upgrades
dpkg-reconfigure -plow unattended-upgrades
```

---

## Scaling & Performance 🚀

### Vertical Scaling (Bigger Droplet)

1. **Snapshot** your droplet first
2. **Resize** droplet in dashboard
3. Choose larger plan
4. Restart droplet

### Horizontal Scaling (Load Balancer)

1. Create multiple droplets with same setup
2. Add **Load Balancer** in DigitalOcean
3. Configure health checks
4. Point domain to load balancer

### Database Scaling

1. Upgrade database plan
2. Add read replicas
3. Enable connection pooling

---

## Troubleshooting 🔧

### Application Won't Start

```bash
# Check logs
docker logs zenpay-backend
# or
pm2 logs zenpay-backend

# Check if port is in use
netstat -tuln | grep 5000

# Check environment variables
docker exec zenpay-backend env
```

### Database Connection Issues

```bash
# Test connection
psql -h YOUR_DB_HOST -U zenpay_user -d zenpay_db

# Check if PostgreSQL is running
systemctl status postgresql

# Check firewall
ufw status
```

### SSL Certificate Issues

```bash
# Check certificate
certbot certificates

# Renew manually
certbot renew

# Check Nginx config
nginx -t
```

### High Memory Usage

```bash
# Check memory
free -h

# Restart application
docker restart zenpay-backend
# or
pm2 restart zenpay-backend

# Consider upgrading droplet
```

---

## Cost Breakdown 💰

### App Platform
- **App**: $5-12/month
- **Database**: $7-15/month
- **Total**: ~$12-27/month

### Droplet + Managed DB
- **Droplet**: $6-24/month
- **Database**: $7-15/month
- **Total**: ~$13-39/month

### Droplet Only (Self-hosted DB)
- **Droplet**: $12-24/month (need more RAM for DB)
- **Total**: ~$12-24/month

**Recommendation**: Start with App Platform ($12/month) or Droplet + Managed DB ($13/month)

---

## Quick Commands Reference 📝

```bash
# Docker
docker ps                              # List containers
docker logs -f zenpay-backend         # View logs
docker restart zenpay-backend         # Restart
docker exec -it zenpay-backend sh     # Shell into container

# PM2
pm2 status                            # Status
pm2 logs zenpay-backend              # Logs
pm2 restart zenpay-backend           # Restart
pm2 monit                            # Monitor

# Nginx
nginx -t                              # Test config
systemctl restart nginx              # Restart
systemctl status nginx               # Status

# Database
psql -U zenpay_user -d zenpay_db    # Connect
pg_dump zenpay_db > backup.sql      # Backup

# SSL
certbot renew                        # Renew certificates
certbot certificates                 # List certificates

# System
htop                                 # Monitor resources
df -h                                # Disk usage
ufw status                           # Firewall status
```

---

## Support 📞

- **DigitalOcean Docs**: https://docs.digitalocean.com
- **Community**: https://www.digitalocean.com/community
- **Support Tickets**: Available for paid accounts
- **Status**: https://status.digitalocean.com

---

**Your Zenpay backend is ready for DigitalOcean! 🚀**

Choose App Platform for simplicity or Droplet for control. Both work great!



# 🚀 Zenpay Backend Deployment Guide

This guide covers deploying the Zenpay backend to various platforms.

## 📋 Prerequisites

Before deployment, ensure you have:

1. **Database**: PostgreSQL database (can be provided by hosting platform)
2. **Blockchain RPC**: Ethereum/Sepolia RPC endpoint (Alchemy, Infura, etc.)
3. **Environment Variables**: All required env vars configured
4. **Smart Contracts**: Deployed contract addresses

## 🔧 Pre-Deployment Checklist

### 1. Generate JWT Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Prepare Environment Variables

Copy `.env.example` to `.env` and fill in all required values:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET` & `JWT_REFRESH_SECRET`: Generated above
- `ETHEREUM_RPC_URL`: Your RPC endpoint
- `ETH_*`: Smart contract addresses
- `FRONTEND_URL`: Your frontend domain
- Other optional configs

### 3. Test Locally

```bash
# Install dependencies
npm install

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start server
npm start
```

Visit `http://localhost:5000/health` to verify it's running.

---

## 🌐 Deployment Options

## Option 1: Render.com (Recommended)

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy via Dashboard

1. **Create PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Name: `zenpay-db`
   - Plan: Free or Starter
   - Note the **Internal Database URL**

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `zenpay-backend`
     - **Region**: Choose closest to users
     - **Branch**: `main`
     - **Root Directory**: `backend`
     - **Runtime**: Node
     - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
     - **Start Command**: `npm start`
     - **Plan**: Free or Starter

3. **Configure Environment Variables**
   
   Go to Environment tab and add:
   
   ```
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=[Internal Database URL from step 1]
   JWT_SECRET=[Generated secret]
   JWT_REFRESH_SECRET=[Generated secret]
   JWT_EXPIRES_IN=1h
   JWT_REFRESH_EXPIRES_IN=7d
   ETHEREUM_RPC_URL=[Your RPC URL]
   ETHEREUM_CHAIN_ID=1
   MNEMONIC=[Your wallet mnemonic]
   ETH_EMPLOYEE_REGISTRY=[Contract address]
   ETH_INVOICE_MANAGER=[Contract address]
   ETH_PAYMENT_APPROVAL=[Contract address]
   ETH_CORE_PAYROLL=[Contract address]
   FRONTEND_URL=[Your frontend URL]
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build and deployment
   - Your API will be live at `https://zenpay-backend.onrender.com`

### Step 3: Alternative - Deploy via render.yaml

```bash
# Push render.yaml to your repo
git add render.yaml
git commit -m "Add Render deployment config"
git push

# In Render dashboard:
# New + → Blueprint
# Connect repository
# Select render.yaml
```

---

## Option 2: Railway.app

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub

### Step 2: Deploy

1. **Create New Project**
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository

2. **Add PostgreSQL**
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway auto-generates `DATABASE_URL`

3. **Configure Service**
   - Click on your service
   - Go to "Settings"
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`

4. **Add Environment Variables**
   - Go to "Variables" tab
   - Add all required env vars (same as Render)
   - `DATABASE_URL` is auto-added from PostgreSQL service

5. **Deploy**
   - Railway auto-deploys on push
   - Get your URL from "Settings" → "Domains"

---

## Option 3: Heroku

### Step 1: Install Heroku CLI

```bash
# Install Heroku CLI
# macOS
brew tap heroku/brew && brew install heroku

# Windows
# Download from https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login
```

### Step 2: Deploy

```bash
# Navigate to backend directory
cd backend

# Create Heroku app
heroku create zenpay-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set JWT_EXPIRES_IN=1h
heroku config:set JWT_REFRESH_EXPIRES_IN=7d
heroku config:set ETHEREUM_RPC_URL=your_rpc_url
heroku config:set ETHEREUM_CHAIN_ID=1
heroku config:set MNEMONIC="your mnemonic"
heroku config:set ETH_EMPLOYEE_REGISTRY=your_address
heroku config:set ETH_INVOICE_MANAGER=your_address
heroku config:set ETH_PAYMENT_APPROVAL=your_address
heroku config:set ETH_CORE_PAYROLL=your_address
heroku config:set FRONTEND_URL=https://your-frontend.com

# Deploy
git push heroku main

# Run migrations
heroku run npx prisma migrate deploy

# Check logs
heroku logs --tail
```

---

## Option 4: Docker Deployment

### Step 1: Build Docker Image

```bash
# Build image
docker build -t zenpay-backend .

# Test locally
docker run -p 5000:5000 --env-file .env zenpay-backend
```

### Step 2: Deploy to Docker Hub

```bash
# Tag image
docker tag zenpay-backend yourusername/zenpay-backend:latest

# Push to Docker Hub
docker push yourusername/zenpay-backend:latest
```

### Step 3: Deploy on VPS (DigitalOcean, AWS, etc.)

```bash
# On your server
docker pull yourusername/zenpay-backend:latest

# Run container
docker run -d \
  -p 5000:5000 \
  --name zenpay-backend \
  --env-file .env \
  --restart unless-stopped \
  yourusername/zenpay-backend:latest
```

---

## Option 5: VPS (Manual Setup)

### Step 1: Setup Server

```bash
# Connect to your VPS
ssh user@your-server-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

### Step 2: Setup PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE zenpay_db;
CREATE USER zenpay_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE zenpay_db TO zenpay_user;
\q
```

### Step 3: Deploy Application

```bash
# Clone repository
git clone https://github.com/yourusername/zenpay.git
cd zenpay/backend

# Install dependencies
npm install

# Create .env file
nano .env
# (Paste your environment variables)

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start src/index.js --name zenpay-backend
pm2 save
pm2 startup
```

### Step 4: Setup Nginx (Optional)

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/zenpay

# Add configuration:
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/zenpay /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Setup SSL with Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🔍 Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-11-07T..."
}
```

### 2. API Documentation

Visit: `https://your-backend-url.com/api-docs`

### 3. Test Authentication

```bash
# Register a test user
curl -X POST https://your-backend-url.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

---

## 📊 Monitoring & Maintenance

### View Logs

**Render/Railway**: Check dashboard logs  
**Heroku**: `heroku logs --tail`  
**PM2**: `pm2 logs zenpay-backend`  
**Docker**: `docker logs -f zenpay-backend`

### Database Migrations

```bash
# Create new migration
npx prisma migrate dev --name your_migration_name

# Deploy migration to production
npx prisma migrate deploy
```

### Backup Database

```bash
# PostgreSQL backup
pg_dump -h hostname -U username -d database_name > backup.sql

# Restore
psql -h hostname -U username -d database_name < backup.sql
```

---

## 🚨 Troubleshooting

### Connection Issues

1. Check `DATABASE_URL` format
2. Verify firewall allows database connection
3. Ensure database service is running

### Migration Errors

```bash
# Reset migrations (DANGER: Deletes all data)
npx prisma migrate reset

# Or manually fix
npx prisma migrate resolve --rolled-back migration_name
```

### Memory Issues

- Upgrade your hosting plan
- Optimize Prisma queries
- Add pagination to large data fetches

---

## 📚 Additional Resources

- [Render Docs](https://render.com/docs)
- [Railway Docs](https://docs.railway.app/)
- [Heroku Docs](https://devcenter.heroku.com/)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

---

## 🔐 Security Checklist

- [ ] All secrets stored as environment variables
- [ ] No `.env` file committed to git
- [ ] CORS configured for frontend domain only
- [ ] Rate limiting enabled
- [ ] Helmet security headers active
- [ ] Database credentials rotated
- [ ] SSL/TLS certificate installed
- [ ] Regular security updates applied

---

## 📞 Support

For issues or questions:
- GitHub Issues: [Your repo issues]
- Documentation: [Your docs link]
- Email: support@yourdomain.com


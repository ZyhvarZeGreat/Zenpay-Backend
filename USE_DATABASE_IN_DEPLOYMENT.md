# 🚀 Using Database in DigitalOcean Deployment

Complete guide for connecting your DigitalOcean PostgreSQL database to your deployed application.

## 📋 Your Database Details

```
Host: zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com
Port: 25060
Database: defaultdb
Username: doadmin
Password: YOUR_DATABASE_PASSWORD
SSL Mode: require
```

---

## Option 1: App Platform (Easiest) ⚡

If you're deploying on DigitalOcean App Platform:

### Step 1: Attach Database to App

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click **Apps** → Select your app
3. Go to **Settings** → **Components**
4. Click on your backend component
5. Scroll to **Database** section
6. Click **Attach Database**
7. Select your database cluster: `zenpay-db`
8. Click **Attach**

### Step 2: Environment Variable (Auto-Configured)

The `DATABASE_URL` is automatically injected as `${db.DATABASE_URL}`

**You don't need to add it manually!** It's already available.

### Step 3: Verify in Environment Variables

1. Go to your app → **Settings** → **Components** → Your component
2. Click **Environment Variables**
3. You should see `DATABASE_URL` automatically set (or it uses `${db.DATABASE_URL}`)

### Step 4: Deploy

Your app will automatically use the database. The connection string is managed by DigitalOcean.

**That's it!** No manual configuration needed.

---

## Option 2: Droplet Deployment 🐳

If you're deploying on a Droplet:

### Step 1: SSH into Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### Step 2: Navigate to Your App

```bash
cd /path/to/zenpay/backend
```

### Step 3: Update .env File

Edit your `.env` file:

```bash
nano .env
```

Add or update the `DATABASE_URL`:

```bash
DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

Save and exit (Ctrl+X, then Y, then Enter)

### Step 4: Add IP to Trusted Sources

**IMPORTANT**: Add your Droplet's IP to database Trusted Sources:

1. Go to DigitalOcean Dashboard
2. Click your database cluster
3. **Settings** → **Trusted Sources**
4. Click **Add Trusted Source**
5. Add your Droplet's IP address
6. Or select "All Droplets" if in same account

### Step 5: Test Connection

```bash
node test-db-connection.js
```

### Step 6: Run Migrations (if needed)

```bash
npx prisma generate
npx prisma db push
```

### Step 7: Restart Your Application

```bash
# If using PM2
pm2 restart zenpay-backend

# If using Docker
docker-compose restart backend

# If using systemd
systemctl restart zenpay-backend
```

---

## Option 3: Docker Compose on Droplet 🐳

If using Docker Compose:

### Step 1: Update docker-compose.yml

Make sure your `docker-compose.yml` has:

```yaml
services:
  backend:
    environment:
      - DATABASE_URL=${DATABASE_URL}
    # ... other config
```

### Step 2: Create .env File on Droplet

```bash
nano .env
```

Add:

```bash
DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

### Step 3: Add Droplet IP to Trusted Sources

Same as Option 2, Step 4.

### Step 4: Restart Containers

```bash
docker-compose down
docker-compose up -d
```

---

## 🔒 Security: Trusted Sources

**CRITICAL**: Your database requires IP addresses to be in Trusted Sources.

### For App Platform:
- If your app is on App Platform, it's automatically trusted
- No action needed

### For Droplets:
- Add your Droplet's public IP to Trusted Sources
- Or select "All Droplets" in same account

### How to Find Your Droplet IP:
1. Go to **Droplets** in DigitalOcean
2. Click your droplet
3. Copy the **IPv4** address
4. Add it to database Trusted Sources

---

## ✅ Verification Steps

### 1. Test Connection from Deployment

```bash
# SSH into your Droplet
ssh root@YOUR_DROPLET_IP

# Navigate to app
cd /path/to/zenpay/backend

# Test connection
node test-db-connection.js
```

### 2. Check Application Logs

```bash
# PM2
pm2 logs zenpay-backend

# Docker
docker-compose logs backend

# Systemd
journalctl -u zenpay-backend -f
```

### 3. Test API Endpoint

```bash
curl https://your-api-domain.com/health
```

Should return database connection status.

---

## 🔧 Environment Variables Reference

### For App Platform:
```bash
# Auto-injected (don't add manually)
DATABASE_URL=${db.DATABASE_URL}
```

### For Droplet/Docker:
```bash
DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

### Optional: Connection Pooling
```bash
DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require&connection_limit=10"
```

---

## 🐛 Troubleshooting

### Error: "Can't reach database server"
- ✅ Check Trusted Sources includes your deployment IP
- ✅ Verify database cluster is running
- ✅ Check firewall rules

### Error: "Authentication failed"
- ✅ Verify password is correct (no extra spaces)
- ✅ Check username is `doadmin`
- ✅ Ensure database name is `defaultdb`

### Error: "SSL required"
- ✅ Make sure `?sslmode=require` is in connection string
- ✅ DigitalOcean managed databases always require SSL

### Connection Timeout
- ✅ Check network connectivity
- ✅ Verify port `25060` is correct
- ✅ Check if database cluster is in same region

---

## 📊 Database Connection in Code

Your application code doesn't need to change! Prisma automatically reads `DATABASE_URL` from environment variables:

```javascript
// backend/src/index.js or wherever you initialize Prisma
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Prisma automatically uses DATABASE_URL from process.env
// No code changes needed!
```

---

## 🚀 Quick Start Checklist

### App Platform:
- [ ] Database cluster created
- [ ] App created
- [ ] Database attached to app (Settings → Components → Attach Database)
- [ ] Deploy app
- [ ] Verify connection in logs

### Droplet:
- [ ] Droplet created
- [ ] App deployed to Droplet
- [ ] `.env` file created with `DATABASE_URL`
- [ ] Droplet IP added to Trusted Sources
- [ ] Connection tested
- [ ] Application restarted

---

## 💡 Best Practices

1. **Never commit `.env` files** - Use environment variables in deployment
2. **Use connection pooling** - Add `&connection_limit=10` for better performance
3. **Monitor connections** - Check database metrics in DigitalOcean dashboard
4. **Enable backups** - Already enabled by default on managed databases
5. **Use SSL** - Always required for managed databases (`sslmode=require`)

---

## 🎯 Summary

**App Platform**: Just attach the database in settings - it's automatic!

**Droplet**: 
1. Add `DATABASE_URL` to `.env`
2. Add Droplet IP to Trusted Sources
3. Restart app

**That's it!** Your database is ready to use in production. 🎉


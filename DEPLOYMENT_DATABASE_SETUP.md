# 🚀 Database Connection for Deployment

Complete guide to ensure your database is connected when deploying to any platform.

## 📋 Quick Checklist

- [ ] `DATABASE_URL` environment variable is set
- [ ] Database credentials are correct
- [ ] Database server is accessible from deployment platform
- [ ] Prisma migrations are included in build process
- [ ] Health check endpoint verifies database connection

---

## 🌐 Platform-Specific Setup

### 1. DigitalOcean App Platform (Recommended)

**Best Option:** Attach database directly in App Platform (no IP whitelisting needed)

#### Steps:
1. **Create/Edit App**
   - Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
   - Create new app or edit existing

2. **Attach Database**
   - Settings → Components → Backend Component
   - Scroll to **Database** section
   - Click **Attach Database**
   - Select `zenpay-db`
   - Click **Attach**

3. **Environment Variables**
   - Go to **Environment Variables** section
   - Set: `DATABASE_URL=${db.DATABASE_URL}`
   - **Important:** Use `${db.DATABASE_URL}`, NOT the actual connection string!

4. **Build Command**
   ```
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

5. **Release Command** (Optional, in Procfile)
   ```
   release: npx prisma migrate deploy
   ```

**✅ Benefits:**
- No IP whitelisting needed
- Automatic SSL
- Connection pooling handled
- Database automatically trusted

---

### 2. Render.com

Your `render.yaml` is already configured! Just ensure:

1. **Create Database in Render**
   - Go to Render Dashboard → New → PostgreSQL
   - Name: `zenpay-db`
   - The `render.yaml` will automatically link it

2. **Deploy Service**
   - Push code to GitHub
   - Render will auto-detect `render.yaml`
   - Database connection string auto-injected

**Your render.yaml config:**
```yaml
envVars:
  - key: DATABASE_URL
    fromDatabase:
      name: zenpay-db
      property: connectionString
```

**✅ Benefits:**
- Automatic database linking
- No manual configuration needed

---

### 3. Railway

1. **Add PostgreSQL Service**
   - Create new PostgreSQL database in Railway
   - Railway auto-generates `DATABASE_URL`

2. **Environment Variables**
   - Railway automatically sets `DATABASE_URL`
   - No manual configuration needed

3. **Build Command**
   ```
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

**✅ Benefits:**
- Zero-config database setup
- Auto-generated connection string

---

### 4. Heroku

1. **Add PostgreSQL Addon**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

2. **Environment Variables**
   - `DATABASE_URL` is automatically set by Heroku
   - No manual configuration needed

3. **Procfile** (Already configured)
   ```
   web: npm start
   release: npx prisma migrate deploy
   ```

**✅ Benefits:**
- Automatic `DATABASE_URL` injection
- Release command runs migrations automatically

---

### 5. Vercel / Other Platforms

**Manual Configuration Required:**

1. **Set Environment Variable**
   ```
   DATABASE_URL=postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require
   ```

2. **Important:** 
   - ⚠️ Add deployment platform IPs to DigitalOcean Trusted Sources
   - ⚠️ Or use a connection pooler (like PgBouncer)

3. **Build Command**
   ```
   npm install && npx prisma generate
   ```

**⚠️ Limitations:**
- Need to whitelist IPs manually
- May need connection pooler for serverless

---

## 🔍 Verification Steps

### 1. Check Health Endpoint

After deployment, test:
```bash
curl https://your-app-url.com/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

**If database is disconnected:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "error",
  "error": "Connection error message"
}
```

### 2. Check Build Logs

Look for:
- ✅ `Prisma Client generated`
- ✅ `Database connection successful`
- ✅ `Running migrations...`
- ✅ `Migrations applied`

### 3. Check Runtime Logs

Look for:
- ✅ `✓ Database connected successfully`
- ✅ No database connection errors

---

## 🛠️ Troubleshooting

### Database Connection Fails

1. **Check Environment Variable**
   ```bash
   # In deployment platform, verify:
   echo $DATABASE_URL
   ```

2. **Verify Database is Running**
   - DigitalOcean: Check database cluster status
   - Other platforms: Check database service status

3. **Check Trusted Sources** (for DigitalOcean)
   - If using manual connection string
   - Add deployment platform IPs to Trusted Sources

4. **Check SSL Mode**
   - Must be `?sslmode=require` for DigitalOcean
   - Some platforms auto-handle SSL

### Prisma Generate Fails

1. **Check Prisma Schema**
   ```bash
   # Verify schema exists
   ls prisma/schema.prisma
   ```

2. **Check Dependencies**
   ```bash
   # Ensure @prisma/client is installed
   npm list @prisma/client
   ```

### Migrations Fail

1. **Use db push for fresh databases**
   ```bash
   npx prisma db push
   ```

2. **Use migrate deploy for existing**
   ```bash
   npx prisma migrate deploy
   ```

---

## 📝 Environment Variables Template

Create this in your deployment platform:

```bash
# Database (auto-set by platform or manual)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Server
NODE_ENV=production
PORT=5000

# JWT (generate secrets)
JWT_SECRET=<generate-random-32-bytes>
JWT_REFRESH_SECRET=<generate-random-32-bytes>
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Blockchain
ETHEREUM_RPC_URL=<your-rpc-url>
ETHEREUM_CHAIN_ID=1
MNEMONIC=<your-mnemonic>

# Smart Contracts
ETH_EMPLOYEE_REGISTRY=<contract-address>
ETH_INVOICE_MANAGER=<contract-address>
ETH_PAYMENT_APPROVAL=<contract-address>
ETH_CORE_PAYROLL=<contract-address>

# Frontend
FRONTEND_URL=<your-frontend-url>
```

**Generate JWT Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## ✅ Pre-Deployment Checklist

- [ ] Database cluster is running
- [ ] `DATABASE_URL` is configured (or will be auto-set)
- [ ] Build command includes `npx prisma generate`
- [ ] Migrations command is set (if needed)
- [ ] Health endpoint is accessible
- [ ] All environment variables are set
- [ ] Trusted Sources configured (if using DigitalOcean manually)

---

## 🚀 Post-Deployment Verification

1. **Test Health Endpoint**
   ```bash
   curl https://your-app-url.com/health
   ```

2. **Check Logs**
   - Look for "Database connected successfully"
   - No connection errors

3. **Test API**
   ```bash
   curl https://your-app-url.com/api/v1/auth/register
   ```

---

## 💡 Best Practices

1. **Never commit `.env` files** - Use platform environment variables
2. **Use platform database linking** when available (DigitalOcean, Render, Railway)
3. **Always test health endpoint** after deployment
4. **Monitor logs** for connection issues
5. **Use connection pooling** for high-traffic apps
6. **Set up database backups** (usually automatic on managed platforms)

---

## 🎯 Quick Reference

| Platform | DATABASE_URL Setup | IP Whitelisting |
|----------|-------------------|-----------------|
| DigitalOcean App Platform | `${db.DATABASE_URL}` | Not needed |
| Render | Auto from `render.yaml` | Not needed |
| Railway | Auto-generated | Not needed |
| Heroku | Auto from addon | Not needed |
| Vercel | Manual env var | Required |
| Other | Manual env var | Required |

---

## 📞 Need Help?

If database connection fails:
1. Check deployment platform logs
2. Verify `DATABASE_URL` is set correctly
3. Test health endpoint: `/health`
4. Check database server status
5. Verify Trusted Sources (if applicable)

Your database is ready - just configure it in your deployment platform! 🚀


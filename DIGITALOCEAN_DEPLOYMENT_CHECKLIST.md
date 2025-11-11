# ✅ DigitalOcean App Platform - Deployment Checklist

## 🔍 Pre-Deployment Verification

### 1. Database Attachment
- [ ] Go to DigitalOcean Dashboard → Apps → Your App
- [ ] Settings → Components → Backend Component
- [ ] Scroll to **Database** section
- [ ] Verify `zenpay-db` is listed as **Attached**
- [ ] If not attached: Click **Attach Database** → Select `zenpay-db` → **Attach**

### 2. Environment Variables
Go to **Environment Variables** section and verify:

**Required:**
- [ ] `DATABASE_URL` = `${db.DATABASE_URL}` ⚠️ **MUST use this format, NOT the actual connection string!**
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `5000`

**JWT (Generate if not set):**
- [ ] `JWT_SECRET` = (32-byte random hex string)
- [ ] `JWT_REFRESH_SECRET` = (32-byte random hex string)
- [ ] `JWT_EXPIRES_IN` = `1h`
- [ ] `JWT_REFRESH_EXPIRES_IN` = `7d`

**Blockchain:**
- [ ] `ETHEREUM_RPC_URL` = (your RPC URL)
- [ ] `ETHEREUM_CHAIN_ID` = `1` (or your chain ID)
- [ ] `MNEMONIC` = (your mnemonic phrase)

**Smart Contracts:**
- [ ] `ETH_EMPLOYEE_REGISTRY` = (contract address)
- [ ] `ETH_INVOICE_MANAGER` = (contract address)
- [ ] `ETH_PAYMENT_APPROVAL` = (contract address)
- [ ] `ETH_CORE_PAYROLL` = (contract address)

**Frontend:**
- [ ] `FRONTEND_URL` = (your frontend URL)

### 3. Build Settings
Go to **Build & Deploy** section:

- [ ] **Build Command:**
  ```
  npm install && npx prisma generate && npx prisma migrate deploy
  ```

- [ ] **Run Command:**
  ```
  npm start
  ```

### 4. Release Command (Optional but Recommended)
In your **Procfile** (already configured):
```
release: npx prisma migrate deploy
```

This runs migrations automatically on each deployment.

---

## 🚀 Deployment Steps

1. **Commit all changes:**
   ```bash
   git add .
   git commit -m "Ready for deployment with database connection"
   git push
   ```

2. **Trigger Deployment:**
   - DigitalOcean will auto-deploy on git push
   - Or manually trigger in App Platform dashboard

3. **Monitor Build Logs:**
   - Go to **Runtime Logs** tab
   - Watch for:
     - ✅ `Prisma Client generated`
     - ✅ `Database connection successful`
     - ✅ `Migrations applied`
     - ✅ `Server running on port 5000`

---

## ✅ Post-Deployment Verification

### 1. Test Health Endpoint
```bash
curl https://your-app-name-xxxxx.ondigitalocean.app/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected"
}
```

### 2. Check Runtime Logs
Look for:
- ✅ `✓ Database connected successfully`
- ✅ No connection errors
- ✅ Server started successfully

### 3. Test API Endpoint
```bash
curl https://your-app-name-xxxxx.ondigitalocean.app/api/v1/auth/register
```

Should return API response (even if error, means server is running).

---

## 🔧 Troubleshooting

### Database Not Connected

**Check:**
1. Database is attached in App Platform settings
2. `DATABASE_URL` is set to `${db.DATABASE_URL}` (not manual string)
3. Database cluster is running (not paused)
4. Check Runtime Logs for error messages

**Fix:**
- Re-attach database if needed
- Verify environment variable format
- Check database cluster status in DigitalOcean

### Build Fails

**Check:**
1. Build command includes `npx prisma generate`
2. `prisma/schema.prisma` exists
3. `@prisma/client` is in `package.json`

**Fix:**
- Update build command
- Verify Prisma files are committed

### Migrations Fail

**Check:**
1. Database has correct permissions
2. Migrations are up to date
3. Database is not locked

**Fix:**
- Use `npx prisma db push` if migrations fail
- Check migration status in logs

---

## 📝 Quick Reference

**Database Connection String Format:**
```
DATABASE_URL=${db.DATABASE_URL}
```

**Build Command:**
```
npm install && npx prisma generate && npx prisma migrate deploy
```

**Health Check:**
```
GET /health
```

**Expected Response:**
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

## 🎯 You're Ready!

If all checkboxes are marked, you're ready to deploy! 🚀

The database connection will work automatically because:
- ✅ Database is attached to your app
- ✅ `DATABASE_URL` uses `${db.DATABASE_URL}` format
- ✅ No IP whitelisting needed
- ✅ SSL handled automatically
- ✅ Connection pooling handled automatically

Just push your code and deploy! 🎉


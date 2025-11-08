# 🔍 How to Check if Database is Connected to App Platform

## Quick Check Methods

### Method 1: Check in DigitalOcean Dashboard

1. **Go to your App:**
   - [DigitalOcean Dashboard](https://cloud.digitalocean.com) → **Apps**
   - Click on your app

2. **Check Database Attachment:**
   - Go to **Settings** → **Components**
   - Click your backend component
   - Scroll to **Database** section
   - You should see: **"Database: zenpay-db"** (if attached)
   - If you see **"Attach Database"** button, it's NOT connected yet

3. **Check Environment Variables:**
   - In the same component, go to **Environment Variables**
   - Look for `DATABASE_URL`
   - Should be: `${db.DATABASE_URL}` (if connected)
   - If it's a manual connection string, it might not be using the attached database

### Method 2: Check Build/Deploy Logs

1. Go to your app → **Runtime Logs** or **Deployments**
2. Look for:
   - ✅ "Prisma Client generated"
   - ✅ "Database connection successful"
   - ✅ No database connection errors
   - ❌ If you see "Can't reach database" or "Authentication failed" → Not connected

### Method 3: Test API Endpoint

If your app is deployed:

```bash
# Replace with your actual app URL
curl https://your-app-name-xxxxx.ondigitalocean.app/health
```

Should return database connection status.

### Method 4: Check App Logs

1. Go to your app → **Runtime Logs**
2. Look for database-related errors or success messages
3. If you see Prisma queries working → Connected ✅
4. If you see connection errors → Not connected ❌

---

## ✅ Signs It's Connected

- Database shows as "Attached" in component settings
- `DATABASE_URL=${db.DATABASE_URL}` in environment variables
- Build logs show "Prisma Client generated" successfully
- No database connection errors in runtime logs
- API endpoints work and can query database

## ❌ Signs It's NOT Connected

- "Attach Database" button is visible (not attached)
- `DATABASE_URL` is a manual connection string (not `${db.DATABASE_URL}`)
- Build fails with database connection errors
- Runtime logs show "Can't reach database" errors
- API returns database errors

---

## 🚀 If Not Connected Yet

Follow these steps:

1. **Attach Database:**
   - App → Settings → Components → Backend Component
   - Scroll to Database → Click "Attach Database"
   - Select `zenpay-db` → Click "Attach"

2. **Verify Environment Variable:**
   - Environment Variables → `DATABASE_URL` should be `${db.DATABASE_URL}`
   - If it's a manual string, delete it and let App Platform manage it

3. **Redeploy:**
   - Save changes
   - App will automatically redeploy
   - Watch build logs for success

---

**Check your App Platform dashboard to see if the database is attached!**


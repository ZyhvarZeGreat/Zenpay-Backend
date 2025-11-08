# 🚀 App Platform Database Setup - Step by Step

Complete guide for connecting your DigitalOcean PostgreSQL database to App Platform.

## ✅ Your Database is Ready!

Your database is already set up:
- **Cluster**: `zenpay-db`
- **Host**: `zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com`
- **Database**: `defaultdb`
- **Status**: ✅ Connected and tables created

---

## 📋 Step-by-Step: Connect Database to App Platform

### Step 1: Go to Your App

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click **Apps** in the left sidebar
3. Click on your app (or create a new one)

### Step 2: Navigate to Components

1. Click **Settings** tab
2. Click **Components** in the left menu
3. Click on your **backend component** (the one running your Node.js app)

### Step 3: Attach Database

1. Scroll down to the **Database** section
2. Click **Attach Database** button
3. A modal will appear
4. Select your database cluster: **zenpay-db**
5. Click **Attach**

### Step 4: Verify Environment Variable

1. Still in your component settings
2. Scroll to **Environment Variables** section
3. You should see `DATABASE_URL` automatically set to `${db.DATABASE_URL}`
   - **Don't change this!** It's automatically managed by DigitalOcean
   - The `${db.DATABASE_URL}` variable is injected at runtime

### Step 5: Add Other Environment Variables

While you're in Environment Variables, make sure you have:

```bash
# Required
NODE_ENV=production
PORT=5000
DATABASE_URL=${db.DATABASE_URL}  # ← Auto-injected, don't change!

# JWT Secrets (generate these)
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>

# JWT Settings
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

### Step 6: Update Build Command

Make sure your build command includes Prisma:

1. In your component settings, find **Build Command**
2. Set it to:
   ```bash
   npm install && npx prisma generate && npx prisma db push
   ```
   Or if you have migrations:
   ```bash
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

### Step 7: Save and Deploy

1. Click **Save** or **Update** button
2. Your app will automatically redeploy
3. Watch the build logs to ensure:
   - ✅ Prisma Client generates successfully
   - ✅ Database connection works
   - ✅ Migrations run (if any)

---

## ✅ Verification

### Check Build Logs

1. Go to your app → **Runtime Logs** tab
2. Look for:
   - ✅ "Prisma Client generated"
   - ✅ "Database connection successful"
   - ✅ No database errors

### Test API Endpoint

Once deployed, test your health endpoint:

```bash
curl https://your-app-name-xxxxx.ondigitalocean.app/health
```

Should return database connection status.

### Check Database Connection in Code

Your Prisma code will automatically work:

```javascript
// No code changes needed!
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// This automatically uses DATABASE_URL from environment
await prisma.user.findMany();
```

---

## 🔍 Troubleshooting

### Database Not Appearing in Attach List

- ✅ Make sure database cluster is in the same region as your app
- ✅ Database should be running (not paused)
- ✅ Check you're in the correct DigitalOcean account

### Build Fails with "Can't reach database"

- ✅ Verify database is attached (Step 3)
- ✅ Check `DATABASE_URL` is set to `${db.DATABASE_URL}` (not a manual string)
- ✅ Ensure database cluster is running

### Prisma Generate Fails

- ✅ Make sure `npx prisma generate` is in build command
- ✅ Check `prisma/schema.prisma` exists
- ✅ Verify `@prisma/client` is in `package.json`

### Migration Errors

- ✅ Use `npx prisma db push` for fresh databases (no migrations)
- ✅ Use `npx prisma migrate deploy` if you have migration files
- ✅ Check database has correct permissions

---

## 🎯 Quick Checklist

- [ ] App created on App Platform
- [ ] Database cluster exists (`zenpay-db`)
- [ ] Database attached to app component
- [ ] `DATABASE_URL=${db.DATABASE_URL}` in environment variables
- [ ] Build command includes `npx prisma generate`
- [ ] All other environment variables set
- [ ] App deployed successfully
- [ ] Health endpoint returns success

---

## 💡 Important Notes

1. **Never manually set DATABASE_URL** - Always use `${db.DATABASE_URL}`
2. **Database is automatically trusted** - No need to add IPs to Trusted Sources
3. **Connection pooling** - Handled automatically by DigitalOcean
4. **SSL is automatic** - No need to configure
5. **Backups are automatic** - Daily backups enabled by default

---

## 🚀 That's It!

Once you attach the database and deploy, your app will automatically:
- ✅ Connect to the database
- ✅ Use Prisma to query data
- ✅ Handle all database operations

**No manual connection strings needed!** DigitalOcean handles everything. 🎉

---

## 📞 Need Help?

If you encounter issues:
1. Check build logs in App Platform
2. Check runtime logs for errors
3. Verify database is attached in settings
4. Test database connection manually (if possible)

Your database is ready - just attach it and deploy! 🚀


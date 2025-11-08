# 🗄️ Database Setup - DigitalOcean PostgreSQL

Your database connection details have been configured. Follow these steps:

## 📝 Connection Details

```
Host: zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com
Port: 25060
Database: defaultdb
Username: doadmin
Password: YOUR_DATABASE_PASSWORD
SSL Mode: require
```

## 🔧 Step 1: Update .env File

Add this to your `backend/.env` file:

```bash
DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

**Note**: The password is URL-encoded (space becomes `%20`)

## ✅ Step 2: Test Connection

Run the test script:

```bash
cd backend
node test-db-connection.js
```

This will:
- ✅ Test database connection
- ✅ Show PostgreSQL version
- ✅ List existing tables
- ✅ Verify everything is working

## 🚀 Step 3: Run Migrations

Once connection is verified, run migrations:

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate deploy
```

## 📊 Step 4: Verify Tables

After migrations, verify tables were created:

```bash
node test-db-connection.js
```

You should see tables like:
- User
- Employee
- Payment
- Invoice
- Batch
- etc.

## 🔄 Option: Create New Database (Optional)

If you prefer a custom database name instead of `defaultdb`:

1. **Via DigitalOcean Console:**
   - Go to your database cluster
   - Click **Users & Databases** tab
   - Click **Create Database**
   - Name: `zenpay_db`
   - Click **Create**

2. **Update Connection String:**
   ```bash
   DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/zenpay_db?sslmode=require"
   ```

3. **Run migrations again:**
   ```bash
   npx prisma migrate deploy
   ```

## 🔒 Security Checklist

- [x] SSL mode is set to `require`
- [ ] Trusted Sources configured in DigitalOcean
- [ ] Password is secure and stored safely
- [ ] `.env` file is in `.gitignore`

## 🆘 Troubleshooting

### Connection Refused
- Check **Trusted Sources** in DigitalOcean dashboard
- Add your IP address or App Platform component

### Authentication Failed
- Verify password is correct (including the space)
- Check username is `doadmin`
- Ensure database name is correct

### SSL Error
- Make sure `sslmode=require` is in connection string
- DigitalOcean managed databases require SSL

### Migration Errors
- Ensure Prisma Client is generated: `npx prisma generate`
- Check database user has CREATE TABLE permissions
- Verify DATABASE_URL is correct

## ✅ Next Steps

Once database is set up:
1. ✅ Test connection
2. ✅ Run migrations
3. ✅ Start your backend: `npm start`
4. ✅ Test API endpoints

---

**Your database is ready! 🎉**


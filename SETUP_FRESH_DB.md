# 🚀 Setup Fresh Database on DigitalOcean

Quick guide to set up a brand new database on DigitalOcean.

## ⚡ Quick Setup (Automated)

Run the setup script:

```bash
cd backend
node setup-fresh-db.js
```

This will:
1. ✅ Update your `.env` file with DigitalOcean connection string
2. ✅ Test database connection
3. ✅ Generate Prisma Client
4. ✅ Run migrations (create all tables)
5. ✅ Verify setup

---

## 📝 Manual Setup

### Step 1: Update .env File

Add this to your `backend/.env` file:

```bash
DATABASE_URL="postgresql://doadmin:YOUR_DATABASE_PASSWORD@zenpay-db-do-user-23325703-0.h.db.ondigitalocean.com:25060/defaultdb?sslmode=require"
```

**Note**: The password space is URL-encoded as `%20`

### Step 2: Add Your IP to Trusted Sources

**IMPORTANT**: Do this first, or connection will fail!

1. Go to [DigitalOcean Dashboard](https://cloud.digitalocean.com)
2. Click on your database cluster
3. Go to **Settings** → **Trusted Sources**
4. Click **Add Trusted Source**
5. Add your current IP address
6. Click **Save**

### Step 3: Test Connection

```bash
node test-db-connection.js
```

You should see:
- ✅ Database connection successful!
- PostgreSQL version
- (No tables yet - that's normal)

### Step 4: Generate Prisma Client

```bash
npx prisma generate
```

### Step 5: Run Migrations

```bash
npx prisma migrate deploy
```

This creates all your database tables:
- User
- Employee
- Payment
- Invoice
- Batch
- etc.

### Step 6: Verify

```bash
node test-db-connection.js
```

Now you should see all your tables listed!

---

## ✅ You're Done!

Your database is ready. Start your application:

```bash
npm start
```

---

## 🐛 Troubleshooting

### Connection Refused
- ✅ Check Trusted Sources in DigitalOcean
- ✅ Add your IP address
- ✅ Verify database is running

### Authentication Failed
- ✅ Check password is correct (including the space)
- ✅ Verify username is `doadmin`
- ✅ Ensure database name is `defaultdb`

### Migration Errors
- ✅ Ensure Prisma Client is generated: `npx prisma generate`
- ✅ Check DATABASE_URL is correct in `.env`
- ✅ Verify connection works first: `node test-db-connection.js`

---

**That's it! Your fresh database is ready to use! 🎉**


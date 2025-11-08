# ⚡ Quick Deploy Guide - Zenpay Backend

Choose your preferred platform and follow the steps below.

## 🚀 Fastest: Render.com (1-Click Deploy)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Steps:
1. Click the button above
2. Connect your GitHub repository
3. Render will auto-detect `render.yaml`
4. Add these environment variables:
   ```
   JWT_SECRET=<generate-with-command-below>
   JWT_REFRESH_SECRET=<generate-with-command-below>
   ETHEREUM_RPC_URL=<your-rpc-url>
   MNEMONIC=<your-wallet-mnemonic>
   ETH_EMPLOYEE_REGISTRY=<contract-address>
   ETH_INVOICE_MANAGER=<contract-address>
   ETH_PAYMENT_APPROVAL=<contract-address>
   ETH_CORE_PAYROLL=<contract-address>
   FRONTEND_URL=<your-frontend-url>
   ```
5. Click "Apply" and wait ~5 minutes
6. Your API is live! 🎉

### Generate Secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 🚂 Railway.app (Auto-Deploy on Push)

### Steps:
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Railway auto-detects Node.js
5. Add PostgreSQL: Click "New" → "Database" → "PostgreSQL"
6. Add environment variables (same as above)
7. Deploy! Railway auto-deploys on every push

**Your URL**: Check "Settings" → "Domains"

---

## 🟣 Heroku (CLI Deploy)

### Quick Start:
```bash
# Login
heroku login

# Create app
cd backend
heroku create zenpay-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set env vars
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
heroku config:set ETHEREUM_RPC_URL=your_rpc_url
heroku config:set MNEMONIC="your mnemonic"
heroku config:set ETH_EMPLOYEE_REGISTRY=0x...
heroku config:set ETH_INVOICE_MANAGER=0x...
heroku config:set ETH_PAYMENT_APPROVAL=0x...
heroku config:set ETH_CORE_PAYROLL=0x...
heroku config:set FRONTEND_URL=https://your-frontend.com

# Deploy
git push heroku main

# Open
heroku open
```

---

## 🐳 Docker (Any Platform)

### Build & Run:
```bash
# Build
docker build -t zenpay-backend .

# Run (with .env file)
docker run -p 5000:5000 --env-file .env zenpay-backend

# Or with inline env vars
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="..." \
  -e ETHEREUM_RPC_URL="..." \
  zenpay-backend
```

---

## ✅ Verify Deployment

### 1. Health Check
```bash
curl https://your-api-url.com/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### 2. API Docs
Visit: `https://your-api-url.com/api-docs`

### 3. Test Endpoint
```bash
curl https://your-api-url.com/api/v1/auth/register \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","firstName":"Test","lastName":"User"}'
```

---

## 🔐 Required Environment Variables

### Essential (REQUIRED):
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<32-byte-hex>
JWT_REFRESH_SECRET=<32-byte-hex>
ETHEREUM_RPC_URL=https://...
MNEMONIC=<your 12 words>
ETH_EMPLOYEE_REGISTRY=0x...
ETH_INVOICE_MANAGER=0x...
ETH_PAYMENT_APPROVAL=0x...
ETH_CORE_PAYROLL=0x...
FRONTEND_URL=https://your-frontend.com
```

### Optional (Has Defaults):
```bash
PORT=5000
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
ETHEREUM_CHAIN_ID=1
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🛠️ Troubleshooting

### "Cannot connect to database"
- Check `DATABASE_URL` format
- Ensure database service is running
- Verify network/firewall rules

### "Prisma Client not generated"
- Run: `npx prisma generate`
- Check `postinstall` script in package.json

### "Migration failed"
- Run: `npx prisma migrate deploy`
- Check database permissions

### "Port already in use"
- Change `PORT` environment variable
- Or stop existing process

---

## 📞 Need Help?

- Full guide: See `DEPLOYMENT.md`
- Issues: GitHub Issues
- Discord: [Your Discord]
- Email: support@yourdomain.com

---

## 🎯 Next Steps

After deployment:
1. ✅ Verify health endpoint
2. ✅ Test authentication
3. ✅ Setup monitoring
4. ✅ Configure custom domain
5. ✅ Enable SSL/TLS
6. ✅ Setup CI/CD pipeline
7. ✅ Configure backup strategy

**Happy Deploying! 🚀**


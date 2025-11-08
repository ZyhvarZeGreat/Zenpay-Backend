# ⚡ DigitalOcean Quick Start - 15 Minutes

Deploy Zenpay backend to DigitalOcean in 15 minutes.

## 🎯 Choose Your Path

### Path A: App Platform (Easiest) - 10 minutes
**Best for**: Beginners, quick MVP, don't want to manage servers

### Path B: Droplet + Docker (Recommended) - 15 minutes  
**Best for**: Full control, cost-effective, scalable

---

## Path A: App Platform 🚀

### 1. Create Database (3 min)
```
DigitalOcean Console → Databases → Create
- Engine: PostgreSQL 15
- Plan: Dev ($7/mo) or Basic ($15/mo)
- Region: Nearest to you
- Name: zenpay-db
→ Create
```

### 2. Deploy App (5 min)
```
Apps → Create App
- Source: GitHub repo
- Branch: main
- Directory: /backend
- Build: npm install && npx prisma generate && npx prisma migrate deploy
- Run: npm start
- Port: 5000
→ Next
```

### 3. Add Environment Variables (2 min)
```bash
# Generate secrets first:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Add to App Platform:
NODE_ENV=production
DATABASE_URL=${db.DATABASE_URL}
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
ETHEREUM_RPC_URL=<your-rpc>
MNEMONIC=<your-mnemonic>
ETH_EMPLOYEE_REGISTRY=0x...
ETH_INVOICE_MANAGER=0x...
ETH_PAYMENT_APPROVAL=0x...
ETH_CORE_PAYROLL=0x...
FRONTEND_URL=https://your-frontend.com
```

### 4. Launch! ✅
```
Review → Create Resources
Wait 5-10 minutes
Your API: https://zenpay-backend-xxxxx.ondigitalocean.app
```

**Total Cost**: ~$12-22/month

---

## Path B: Droplet + Docker 🐳

### 1. Create Droplet (2 min)
```
Droplets → Create
- Image: Docker on Ubuntu 22.04
- Plan: Basic $12/mo (2GB RAM)
- Region: Nearest to you
- SSH Key: Add yours
- Hostname: zenpay-backend
→ Create
```

### 2. Create Database (3 min)
```
Databases → Create
- Same as Path A
- Save connection string
```

### 3. Connect & Setup (5 min)
```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Clone repo
git clone https://github.com/yourusername/zenpay.git
cd zenpay/backend

# Create .env file
nano .env
```

Paste:
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@host:25060/db?sslmode=require"
JWT_SECRET=<generated>
JWT_REFRESH_SECRET=<generated>
ETHEREUM_RPC_URL=<your-rpc>
ETHEREUM_CHAIN_ID=1
MNEMONIC=<your-mnemonic>
ETH_EMPLOYEE_REGISTRY=0x...
ETH_INVOICE_MANAGER=0x...
ETH_PAYMENT_APPROVAL=0x...
ETH_CORE_PAYROLL=0x...
FRONTEND_URL=https://your-frontend.com
```

### 4. Deploy with Docker (3 min)
```bash
# Build
docker build -t zenpay-backend .

# Run
docker run -d \
  --name zenpay-backend \
  --restart unless-stopped \
  -p 5000:5000 \
  --env-file .env \
  zenpay-backend

# Check
docker ps
docker logs -f zenpay-backend
```

### 5. Setup Nginx (2 min)
```bash
# Install
apt install -y nginx

# Configure
cat > /etc/nginx/sites-available/zenpay <<EOF
server {
    listen 80;
    server_name api.yourdomain.com;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

# Enable
ln -s /etc/nginx/sites-available/zenpay /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# SSL (optional)
apt install -y certbot python3-certbot-nginx
certbot --nginx -d api.yourdomain.com
```

### 6. Done! ✅
```bash
# Test
curl http://YOUR_DROPLET_IP:5000/health
curl https://api.yourdomain.com/health
```

**Total Cost**: ~$19/month (Droplet $12 + DB $7)

---

## 🧪 Verify Deployment

### Test Health Endpoint
```bash
curl https://your-api-url.com/health
```

Expected:
```json
{"status":"ok","timestamp":"2024-11-07T..."}
```

### Test API Docs
Visit: `https://your-api-url.com/api-docs`

### Test Authentication
```bash
curl -X POST https://your-api-url.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "firstName": "Test",
    "lastName": "User"
  }'
```

---

## 🔧 Common Issues

### "Cannot connect to database"
- Check DATABASE_URL format
- Ensure database is running
- Check firewall rules

### "Port 5000 already in use"
- Stop existing process: `docker stop zenpay-backend`
- Or change PORT in .env

### "Prisma Client not generated"
- Run: `docker exec zenpay-backend npx prisma generate`
- Rebuild: `docker build --no-cache -t zenpay-backend .`

---

## 📊 What You Get

✅ **Production-ready API** running on DigitalOcean  
✅ **PostgreSQL database** with automatic backups  
✅ **SSL certificate** (if using custom domain)  
✅ **Auto-restart** on crashes  
✅ **Health monitoring** built-in  
✅ **Scalable** architecture  

---

## 🚀 Next Steps

1. ✅ Deploy frontend (Vercel/Netlify)
2. ✅ Update FRONTEND_URL in backend
3. ✅ Setup monitoring (UptimeRobot)
4. ✅ Configure custom domain
5. ✅ Setup automated backups
6. ✅ Add team members

---

## 💰 Cost Summary

| Component | App Platform | Droplet |
|-----------|-------------|---------|
| Compute | $5-12/mo | $12/mo |
| Database | $7-15/mo | $7/mo |
| **Total** | **$12-27/mo** | **$19/mo** |

**Recommendation**: Start with App Platform for simplicity, migrate to Droplet later for cost savings.

---

## 📞 Need Help?

- Full Guide: See `DIGITALOCEAN_DEPLOYMENT.md`
- DigitalOcean Docs: https://docs.digitalocean.com
- Community: https://www.digitalocean.com/community

---

**You're ready to deploy! Choose your path and get started! 🎉**



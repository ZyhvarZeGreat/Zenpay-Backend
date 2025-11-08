#!/bin/bash

# DigitalOcean Droplet Setup Script for Zenpay Backend
# Run this on a fresh Ubuntu 22.04 droplet
# Usage: curl -sSL https://raw.githubusercontent.com/yourusername/zenpay/main/backend/digitalocean-setup.sh | bash

set -e

echo "🌊 Zenpay Backend - DigitalOcean Setup"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

echo -e "${BLUE}📦 Installing system updates...${NC}"
apt update && apt upgrade -y

echo ""
echo -e "${BLUE}🐳 Installing Docker...${NC}"
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Start Docker
systemctl start docker
systemctl enable docker

echo ""
echo -e "${BLUE}📦 Installing Node.js 18...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

echo ""
echo -e "${BLUE}🔧 Installing additional tools...${NC}"
apt install -y git nginx certbot python3-certbot-nginx ufw

echo ""
echo -e "${BLUE}🔥 Configuring firewall...${NC}"
ufw --force enable
ufw allow OpenSSH
ufw allow 'Nginx Full'

echo ""
echo -e "${GREEN}✅ System setup complete!${NC}"
echo ""
echo "📋 Next steps:"
echo "1. Clone your repository: git clone https://github.com/yourusername/zenpay.git"
echo "2. Navigate to backend: cd zenpay/backend"
echo "3. Create .env file with your configuration"
echo "4. Build Docker image: docker build -t zenpay-backend ."
echo "5. Run container: docker run -d --name zenpay-backend --restart unless-stopped -p 5000:5000 --env-file .env zenpay-backend"
echo "6. Setup Nginx reverse proxy (see DIGITALOCEAN_DEPLOYMENT.md)"
echo "7. Setup SSL with: certbot --nginx -d api.yourdomain.com"
echo ""
echo -e "${GREEN}🎉 Setup complete! Your droplet is ready for Zenpay deployment.${NC}"



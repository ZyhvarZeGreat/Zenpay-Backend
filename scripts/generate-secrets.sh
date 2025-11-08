#!/bin/bash

# Generate Secrets Script for Zenpay Backend
# Usage: ./scripts/generate-secrets.sh

echo "🔐 Generating secrets for Zenpay Backend"
echo "================================================"

# Generate JWT Secret
echo ""
echo "JWT_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT Refresh Secret
echo ""
echo "JWT_REFRESH_SECRET:"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate API Key
echo ""
echo "API_KEY (optional):"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

echo ""
echo "================================================"
echo "Copy these values to your .env file"
echo ""
echo "Example:"
echo "JWT_SECRET=<value-from-above>"
echo "JWT_REFRESH_SECRET=<value-from-above>"


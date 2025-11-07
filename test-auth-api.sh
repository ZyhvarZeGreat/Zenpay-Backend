#!/bin/bash

# Automated test script for authentication endpoints
# Run this after starting the server with: npm run dev

BASE_URL="http://localhost:5000/api/v1/auth"
EMAIL="test@zenpay.com"
PASSWORD="Test123456!"

echo "🧪 Testing Zenpay Authentication API"
echo "====================================="
echo ""

# Test 1: Register
echo "Test 1: Register User"
echo "---------------------"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'",
    "firstName": "Test",
    "lastName": "User",
    "role": "ADMIN"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract tokens
ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.accessToken')
REFRESH_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.refreshToken')

if [ "$ACCESS_TOKEN" != "null" ]; then
  echo "✅ Registration successful"
else
  echo "❌ Registration failed"
  exit 1
fi

echo ""

# Test 2: Get Current User
echo "Test 2: Get Current User"
echo "------------------------"
curl -s -X GET $BASE_URL/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'

echo ""

# Test 3: Logout
echo "Test 3: Logout"
echo "--------------"
curl -s -X POST $BASE_URL/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$REFRESH_TOKEN'"
  }' | jq '.'

echo ""

# Test 4: Login
echo "Test 4: Login"
echo "-------------"
LOGIN_RESPONSE=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "password": "'$PASSWORD'"
  }')

echo "$LOGIN_RESPONSE" | jq '.'

# Extract new tokens
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.data.accessToken')

if [ "$ACCESS_TOKEN" != "null" ]; then
  echo "✅ Login successful"
else
  echo "❌ Login failed"
  exit 1
fi

echo ""

# Test 5: Update Profile
echo "Test 5: Update Profile"
echo "----------------------"
curl -s -X PUT $BASE_URL/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }' | jq '.'

echo ""

# Test 6: Send OTP
echo "Test 6: Send OTP"
echo "----------------"
OTP_RESPONSE=$(curl -s -X POST $BASE_URL/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$EMAIL'",
    "purpose": "VERIFICATION"
  }')

echo "$OTP_RESPONSE" | jq '.'

# Extract OTP code (development only)
OTP_CODE=$(echo "$OTP_RESPONSE" | jq -r '.code')

echo ""

# Test 7: Verify OTP
if [ "$OTP_CODE" != "null" ]; then
  echo "Test 7: Verify OTP"
  echo "------------------"
  curl -s -X POST $BASE_URL/verify-otp \
    -H "Content-Type: application/json" \
    -d '{
      "email": "'$EMAIL'",
      "code": "'$OTP_CODE'"
    }' | jq '.'
  echo ""
fi

# Test 8: Refresh Token
echo "Test 8: Refresh Token"
echo "---------------------"
REFRESH_RESPONSE=$(curl -s -X POST $BASE_URL/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "'$(echo "$LOGIN_RESPONSE" | jq -r '.data.refreshToken')'"
  }')

echo "$REFRESH_RESPONSE" | jq '.'

echo ""
echo "======================================"
echo "✅ All Authentication Tests Complete!"
echo "======================================"


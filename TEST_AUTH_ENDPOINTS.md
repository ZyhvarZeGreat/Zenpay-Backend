# 🧪 Testing Authentication Endpoints

Complete guide to test all authentication endpoints.

## 🚀 Prerequisites

1. **Database Setup** (if using PostgreSQL):
```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

2. **Start Server**:
```bash
npm run dev
```

Server running at: `http://localhost:5000`

## 📋 Authentication Endpoints

### 1. Register User

```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zenpay.com",
    "password": "SecurePass123!",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "admin@zenpay.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2024-11-04T19:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zenpay.com",
    "password": "SecurePass123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@zenpay.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "ADMIN",
      "isActive": true
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Save the `accessToken` for subsequent requests!**

### 3. Get Current User

```bash
# Replace YOUR_ACCESS_TOKEN with token from login
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@zenpay.com",
    "firstName": "Admin",
    "lastName": "User",
    "role": "ADMIN",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2024-11-04T19:00:00.000Z",
    "updatedAt": "2024-11-04T19:00:00.000Z"
  }
}
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN_HERE"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_access_token_here",
    "refreshToken": "same_refresh_token",
    "user": { ... }
  }
}
```

### 5. Update Profile

```bash
curl -X PUT http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Updated",
    "lastName": "Name"
  }'
```

### 6. Change Password

```bash
curl -X POST http://localhost:5000/api/v1/auth/change-password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

### 7. Forgot Password

```bash
curl -X POST http://localhost:5000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zenpay.com"
  }'
```

**Response (Development):**
```json
{
  "success": true,
  "message": "If the email exists, a reset link has been sent",
  "resetToken": "abc123..." 
}
```

### 8. Reset Password

```bash
curl -X POST http://localhost:5000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "RESET_TOKEN_FROM_FORGOT_PASSWORD",
    "newPassword": "NewPassword123!"
  }'
```

### 9. Send OTP

```bash
curl -X POST http://localhost:5000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zenpay.com",
    "purpose": "VERIFICATION"
  }'
```

**Response (Development):**
```json
{
  "success": true,
  "message": "OTP sent to your email",
  "code": "123456"
}
```

### 10. Verify OTP

```bash
curl -X POST http://localhost:5000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@zenpay.com",
    "code": "123456"
  }'
```

### 11. Logout

```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## 🔐 Authentication Flow

### Complete Workflow Example

```bash
# 1. Register
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@zenpay.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "FINANCE_MANAGER"
  }')

echo $REGISTER_RESPONSE

# 2. Extract access token (using jq)
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.accessToken')

# 3. Use token to access protected endpoint
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# 4. Test protected employee endpoint
curl -X GET http://localhost:5000/api/v1/employees \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

## 🧪 Test with Postman/Insomnia

### Import Collection

Create a Postman collection with these endpoints or use the Swagger UI:

```
http://localhost:5000/api-docs
```

### Environment Variables

Set in Postman:
- `BASE_URL`: `http://localhost:5000`
- `ACCESS_TOKEN`: `{{accessToken}}`
- `REFRESH_TOKEN`: `{{refreshToken}}`

## ✅ Expected Responses

### Success Response (200/201)
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response (400/401/403/409/500)
```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... },
  "timestamp": "2024-11-04T19:00:00.000Z"
}
```

## 🔑 User Roles

Available roles:
- `ADMIN` - Full access
- `FINANCE_MANAGER` - Can process payments
- `VIEWER` - Read-only access
- `EMPLOYEE` - View own data

## 🛡️ Security Features

### Rate Limiting
- Auth endpoints: 5 requests per 15 minutes
- Prevents brute force attacks

### Password Requirements
- Minimum 8 characters
- Bcrypt hashing with salt

### JWT Tokens
- Access token: 1 hour
- Refresh token: 7 days
- Stored in database

### OTP
- 6-digit code
- Expires in 10 minutes
- One-time use only

## 🐛 Common Errors

### 401 Unauthorized
```json
{
  "error": "Invalid token",
  "code": "UNAUTHORIZED"
}
```
**Solution**: Token expired or invalid. Login again.

### 409 Conflict
```json
{
  "error": "User already exists",
  "code": "USER_EXISTS"
}
```
**Solution**: Use different email address.

### 429 Too Many Requests
```json
{
  "error": "Too many requests, please try again later",
  "code": "RATE_LIMIT_EXCEEDED"
}
```
**Solution**: Wait 15 minutes before trying again.

## 📊 Testing Checklist

- [ ] Register new user
- [ ] Login with credentials
- [ ] Get current user with token
- [ ] Refresh access token
- [ ] Update profile
- [ ] Change password
- [ ] Forgot password flow
- [ ] Reset password
- [ ] Send OTP
- [ ] Verify OTP
- [ ] Logout
- [ ] Test with invalid credentials
- [ ] Test with expired token
- [ ] Test rate limiting

## 🎯 Next Steps

After authentication works:
1. ✅ Authentication endpoints complete
2. ⬜ Employee management endpoints
3. ⬜ Payment processing endpoints
4. ⬜ Invoice management endpoints
5. ⬜ Analytics endpoints

---

**Authentication system is production-ready!** 🎉


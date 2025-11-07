const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');
const crypto = require('crypto');

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password, firstName, lastName, role = 'VIEWER' } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw { statusCode: 409, message: 'User already exists', code: 'USER_EXISTS' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
        role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Create audit log
    await this.createAuditLog(user.id, 'USER_REGISTERED', 'User', { email: user.email });

    logger.info(`User registered: ${user.email}`);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login user
   */
  async login(email, password, ipAddress, userAgent) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    // Check if user is active
    if (!user.isActive) {
      throw { statusCode: 401, message: 'Account is inactive', code: 'ACCOUNT_INACTIVE' };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Create audit log
    await this.createAuditLog(user.id, 'USER_LOGIN', 'User', { email: user.email }, ipAddress, userAgent);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
      },
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

      // Check if token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord) {
        throw { statusCode: 401, message: 'Invalid refresh token', code: 'INVALID_TOKEN' };
      }

      // Check if token is expired
      if (new Date() > tokenRecord.expiresAt) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
        throw { statusCode: 401, message: 'Refresh token expired', code: 'TOKEN_EXPIRED' };
      }

      // Check if user is active
      if (!tokenRecord.user.isActive) {
        throw { statusCode: 401, message: 'Account is inactive', code: 'ACCOUNT_INACTIVE' };
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(tokenRecord.user.id);

      return {
        accessToken,
        refreshToken, // Return same refresh token
        user: {
          id: tokenRecord.user.id,
          email: tokenRecord.user.email,
          firstName: tokenRecord.user.firstName,
          lastName: tokenRecord.user.lastName,
          role: tokenRecord.user.role,
        },
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw { statusCode: 401, message: 'Invalid refresh token', code: 'INVALID_TOKEN' };
      }
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken) {
    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    logger.info('User logged out');
  }

  /**
   * Forgot password - send reset token
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store in database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRES_IN || 3600000)),
      },
    });

    // TODO: Send email with reset token
    logger.info(`Password reset requested for: ${email}`);

    return {
      message: 'If the email exists, a reset link has been sent',
      resetToken, // In production, send via email
    };
  }

  /**
   * Reset password
   */
  async resetPassword(token, newPassword) {
    // Hash the provided token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find reset record
    const resetRecord = await prisma.passwordReset.findFirst({
      where: {
        token: hashedToken,
        used: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!resetRecord) {
      throw { statusCode: 400, message: 'Invalid or expired reset token', code: 'INVALID_TOKEN' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    // Mark reset token as used
    await prisma.passwordReset.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    // Delete all refresh tokens for this user
    await prisma.refreshToken.deleteMany({
      where: { userId: resetRecord.userId },
    });

    logger.info(`Password reset for user: ${resetRecord.user.email}`);

    return { message: 'Password reset successful' };
  }

  /**
   * Generate OTP code
   */
  async generateOTP(email, purpose = 'VERIFICATION') {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found', code: 'USER_NOT_FOUND' };
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in database
    await prisma.otpCode.create({
      data: {
        userId: user.id,
        code,
        purpose,
        expiresAt: new Date(Date.now() + parseInt(process.env.OTP_EXPIRES_IN || 600000)),
      },
    });

    // TODO: Send OTP via email
    logger.info(`OTP generated for: ${email}`);

    return {
      message: 'OTP sent to your email',
      code, // In production, send via email instead of returning
    };
  }

  /**
   * Verify OTP code
   */
  async verifyOTP(email, code) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found', code: 'USER_NOT_FOUND' };
    }

    // Find valid OTP
    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      throw { statusCode: 400, message: 'Invalid or expired OTP', code: 'INVALID_OTP' };
    }

    // Mark as used
    await prisma.otpCode.update({
      where: { id: otpRecord.id },
      data: { used: true },
    });

    // Update email verification if purpose was verification
    if (otpRecord.purpose === 'VERIFICATION') {
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    logger.info(`OTP verified for: ${email}`);

    return { message: 'OTP verified successfully' };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData) {
    const { firstName, lastName, email } = updateData;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email: email.toLowerCase() }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
      },
    });

    logger.info(`Profile updated for user: ${user.email}`);

    return user;
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw { statusCode: 400, message: 'Current password is incorrect', code: 'INVALID_PASSWORD' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Delete all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    logger.info(`Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully' };
  }

  // Helper Methods

  /**
   * Generate access and refresh tokens
   */
  async generateTokens(userId) {
    const accessToken = this.generateAccessToken(userId);
    const refreshToken = this.generateRefreshToken(userId);

    // Store refresh token in database
    const expiresAt = new Date(Date.now() + this.parseTimeToMs(process.env.JWT_REFRESH_EXPIRES_IN || '7d'));

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Generate access token
   */
  generateAccessToken(userId) {
    return jwt.sign(
      { userId, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId, type: 'refresh' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );
  }

  /**
   * Parse time string to milliseconds
   */
  parseTimeToMs(timeString) {
    const match = timeString.match(/^(\d+)([smhd])$/);
    if (!match) return 3600000; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * units[unit];
  }

  /**
   * Create audit log
   */
  async createAuditLog(userId, action, resource, details = {}, ipAddress = null, userAgent = null) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
        ipAddress,
        userAgent,
      },
    });
  }
}

module.exports = new AuthService();


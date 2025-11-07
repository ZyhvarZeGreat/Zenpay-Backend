const bcrypt = require('bcryptjs');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class UserService {
  /**
   * Get all users with pagination and filters
   */
  async getAllUsers({ page = 1, limit = 10, role, isActive, search }) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where = {};
      
      if (role) {
        where.role = role;
      }
      
      if (isActive !== undefined) {
        where.isActive = isActive === 'true' || isActive === true;
      }
      
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get users and total count
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: parseInt(limit),
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      return {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      return user;
    } catch (error) {
      logger.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  async createUser(data) {
    try {
      // Check if email already exists
      const existing = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existing) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role || 'VIEWER',
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      logger.info(`User created: ${user.id} (${user.email})`);
      return user;
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(id, data) {
    try {
      // Check if user exists
      const existing = await prisma.user.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('User not found');
      }

      // Check for email conflicts if email is being updated
      if (data.email && data.email.toLowerCase() !== existing.email) {
        const conflict = await prisma.user.findUnique({
          where: { email: data.email.toLowerCase() },
        });

        if (conflict) {
          throw new Error('Email already in use by another user');
        }
      }

      // Prepare update data
      const updateData = {};
      if (data.firstName) updateData.firstName = data.firstName;
      if (data.lastName) updateData.lastName = data.lastName;
      if (data.email) updateData.email = data.email.toLowerCase();
      if (data.role) updateData.role = data.role;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;

      // Update user
      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`User updated: ${id}`);
      return user;
    } catch (error) {
      logger.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id, currentUserId) {
    try {
      // Prevent self-deletion
      if (id === currentUserId) {
        throw new Error('Cannot delete your own account');
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Delete user (cascade will handle related records)
      await prisma.user.delete({
        where: { id },
      });

      logger.info(`User deleted: ${id}`);
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(id, role, currentUserId) {
    try {
      // Prevent self-role change to non-admin
      if (id === currentUserId && role !== 'ADMIN') {
        throw new Error('Cannot change your own role from ADMIN');
      }

      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { role },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      logger.info(`User role updated: ${id} -> ${role}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating user role ${id}:`, error);
      throw error;
    }
  }

  /**
   * Activate/Deactivate user
   */
  async updateUserStatus(id, isActive) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
        },
      });

      logger.info(`User status updated: ${id} -> ${isActive ? 'ACTIVE' : 'INACTIVE'}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating user status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Reset user password (admin action)
   */
  async resetUserPassword(id, newPassword) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id },
        data: { password: hashedPassword },
      });

      logger.info(`User password reset: ${id}`);
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      logger.error(`Error resetting user password ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get user activity (audit logs)
   */
  async getUserActivity(userId, { page = 1, limit = 20 }) {
    try {
      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where: { userId },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.auditLog.count({ where: { userId } }),
      ]);

      return {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching user activity for ${userId}:`, error);
      throw error;
    }
  }
}

module.exports = new UserService();


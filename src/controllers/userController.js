const userService = require('../services/userService');
const logger = require('../utils/logger');

class UserController {
  /**
   * Get all users
   * GET /api/v1/users
   */
  async getAllUsers(req, res, next) {
    try {
      const { page, limit, role, isActive, search } = req.query;
      
      const result = await userService.getAllUsers({
        page,
        limit,
        role,
        isActive,
        search,
      });

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   * GET /api/v1/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      
      const user = await userService.getUserById(id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Create new user
   * POST /api/v1/users
   */
  async createUser(req, res, next) {
    try {
      const {
        email,
        password,
        firstName,
        lastName,
        role,
        isActive,
      } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'Email, password, first name, and last name are required',
        });
      }

      // Validate role
      const validRoles = ['ADMIN', 'FINANCE_MANAGER', 'VIEWER', 'EMPLOYEE'];
      if (role && !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
      }

      const user = await userService.createUser({
        email,
        password,
        firstName,
        lastName,
        role,
        isActive,
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error) {
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Update user
   * PUT /api/v1/users/:id
   */
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Validate role if provided
      if (updateData.role) {
        const validRoles = ['ADMIN', 'FINANCE_MANAGER', 'VIEWER', 'EMPLOYEE'];
        if (!validRoles.includes(updateData.role)) {
          return res.status(400).json({
            success: false,
            error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
          });
        }
      }

      const user = await userService.updateUser(id, updateData);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('already in use')) {
        return res.status(409).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Delete user
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await userService.deleteUser(id, req.user.id);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Update user role
   * PATCH /api/v1/users/:id/role
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['ADMIN', 'FINANCE_MANAGER', 'VIEWER', 'EMPLOYEE'];
      if (!role || !validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: `Invalid role. Must be one of: ${validRoles.join(', ')}`,
        });
      }

      const user = await userService.updateUserRole(id, role, req.user.id);

      res.json({
        success: true,
        message: 'User role updated successfully',
        data: user,
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      if (error.message.includes('Cannot change')) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Update user status (activate/deactivate)
   * PATCH /api/v1/users/:id/status
   */
  async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'isActive must be a boolean value',
        });
      }

      const user = await userService.updateUserStatus(id, isActive);

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: user,
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Reset user password
   * POST /api/v1/users/:id/reset-password
   */
  async resetUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long',
        });
      }

      const result = await userService.resetUserPassword(id, newPassword);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Get user activity
   * GET /api/v1/users/:id/activity
   */
  async getUserActivity(req, res, next) {
    try {
      const { id } = req.params;
      const { page, limit } = req.query;

      const result = await userService.getUserActivity(id, { page, limit });

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();


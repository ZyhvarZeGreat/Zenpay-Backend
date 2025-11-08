const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class EmployeeService {
  /**
   * Get all employees with pagination and filters
   */
  async getAllEmployees({ page = 1, limit = 10, status, department, search }) {
    try {
      const skip = (page - 1) * limit;
      
      // Build where clause
      const where = {};
      
      if (status) {
        where.status = status;
      }
      
      if (department) {
        where.department = department;
      }
      
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { walletAddress: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Get employees and total count
      const [employees, total] = await Promise.all([
        prisma.employee.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.employee.count({ where }),
      ]);

      return {
        employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching employees:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          payments: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          invoices: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      return employee;
    } catch (error) {
      logger.error(`Error fetching employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Create new employee
   */
  async createEmployee(data) {
    try {
      // Check if email or wallet already exists
      const existing = await prisma.employee.findFirst({
        where: {
          OR: [
            { email: data.email },
            { walletAddress: data.walletAddress },
          ],
        },
      });

      if (existing) {
        throw new Error('Employee with this email or wallet address already exists');
      }

      // Get the next blockchain ID
      const lastEmployee = await prisma.employee.findFirst({
        orderBy: { blockchainId: 'desc' },
      });

      const blockchainId = lastEmployee ? lastEmployee.blockchainId + 1 : 1;

      // Create employee
      const employee = await prisma.employee.create({
        data: {
          ...data,
          blockchainId,
        },
      });

      logger.info(`Employee created: ${employee.id} (${employee.firstName} ${employee.lastName})`);
      return employee;
    } catch (error) {
      logger.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(id, data) {
    try {
      // Check if employee exists
      const existing = await prisma.employee.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Employee not found');
      }

      // Check for email/wallet conflicts if they're being updated
      if (data.email || data.walletAddress) {
        const conflict = await prisma.employee.findFirst({
          where: {
            AND: [
              { id: { not: id } },
              {
                OR: [
                  data.email ? { email: data.email } : {},
                  data.walletAddress ? { walletAddress: data.walletAddress } : {},
                ],
              },
            ],
          },
        });

        if (conflict) {
          throw new Error('Email or wallet address already in use by another employee');
        }
      }

      // Update employee
      const employee = await prisma.employee.update({
        where: { id },
        data,
      });

      logger.info(`Employee updated: ${id}`);
      return employee;
    } catch (error) {
      logger.error(`Error updating employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete employee
   */
  async deleteEmployee(id) {
    try {
      // Check if employee exists
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          payments: { take: 1 },
          invoices: { take: 1 },
        },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Check if employee has payments or invoices
      if (employee.payments.length > 0 || employee.invoices.length > 0) {
        throw new Error('Cannot delete employee with existing payments or invoices. Deactivate instead.');
      }

      // Delete employee
      await prisma.employee.delete({
        where: { id },
      });

      logger.info(`Employee deleted: ${id}`);
      return { success: true, message: 'Employee deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting employee ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update employee status
   */
  async updateEmployeeStatus(id, status) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      const updated = await prisma.employee.update({
        where: { id },
        data: { status },
      });

      logger.info(`Employee status updated: ${id} -> ${status}`);
      return updated;
    } catch (error) {
      logger.error(`Error updating employee status ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get employees by department
   */
  async getEmployeesByDepartment(department) {
    try {
      const employees = await prisma.employee.findMany({
        where: {
          department: department.toUpperCase(),
          status: 'ACTIVE',
        },
        orderBy: { lastName: 'asc' },
      });

      return employees;
    } catch (error) {
      logger.error(`Error fetching employees by department ${department}:`, error);
      throw error;
    }
  }

  /**
   * Get active employees
   */
  async getActiveEmployees() {
    try {
      const employees = await prisma.employee.findMany({
        where: {
          status: 'ACTIVE',
        },
        orderBy: { lastName: 'asc' },
      });

      return employees;
    } catch (error) {
      logger.error('Error fetching active employees:', error);
      throw error;
    }
  }

  /**
   * Get employee payment history
   */
  async getEmployeePaymentHistory(employeeId, { page = 1, limit = 10 }) {
    try {
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where: { employeeId },
          skip,
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
        }),
        prisma.payment.count({ where: { employeeId } }),
      ]);

      return {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error(`Error fetching payment history for employee ${employeeId}:`, error);
      throw error;
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Parallel queries for all stats
      const [
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        suspendedEmployees,
        employeesThisMonth,
        employeesLastMonth,
        allEmployees,
        employeesByDepartment,
        employeesByNetwork,
        completedPayments,
      ] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { status: 'ACTIVE' } }),
        prisma.employee.count({ where: { status: 'INACTIVE' } }),
        prisma.employee.count({ where: { status: 'SUSPENDED' } }),
        prisma.employee.count({ where: { createdAt: { gte: startOfMonth } } }),
        prisma.employee.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        prisma.employee.findMany({
          select: {
            salaryAmount: true,
            salaryToken: true,
            department: true,
            network: true,
            status: true,
            walletAddress: true,
          },
        }),
        prisma.employee.groupBy({
          by: ['department'],
          _count: {
            id: true,
          },
        }),
        prisma.employee.groupBy({
          by: ['network'],
          _count: {
            id: true,
          },
        }),
        prisma.payment.findMany({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startOfMonth },
          },
          select: {
            amount: true,
            employeeId: true,
          },
        }),
      ]);

      // Calculate wallet statistics from allEmployees array
      const employeesWithWallet = allEmployees.filter(emp => emp.walletAddress !== null && emp.walletAddress !== undefined).length;
      const employeesWithoutWallet = allEmployees.length - employeesWithWallet;

      // Calculate monthly payroll
      const monthlyPayroll = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

      // Calculate average salary
      const totalSalary = allEmployees.reduce((sum, emp) => sum + parseFloat(emp.salaryAmount || 0), 0);
      const avgSalary = allEmployees.length > 0 ? totalSalary / allEmployees.length : 0;

      // Calculate average monthly payroll per employee
      const avgMonthlyPayrollPerEmployee = activeEmployees > 0 ? monthlyPayroll / activeEmployees : 0;

      // Month-over-month change
      const newEmployeesChange = employeesLastMonth > 0
        ? ((employeesThisMonth - employeesLastMonth) / employeesLastMonth * 100).toFixed(1)
        : employeesThisMonth > 0 ? '100.0' : '0.0';

      // Department distribution
      const departmentStats = employeesByDepartment.map(dept => ({
        name: dept.department,
        count: dept._count.id,
        percent: totalEmployees > 0 ? Math.round((dept._count.id / totalEmployees) * 100) : 0,
      }));

      // Network distribution
      const networkStats = employeesByNetwork
        .filter(n => n.network)
        .map(net => ({
          name: net.network,
          count: net._count.id,
          percent: totalEmployees > 0 ? Math.round((net._count.id / totalEmployees) * 100) : 0,
        }));

      // Active percentage
      const activePercent = totalEmployees > 0 ? Math.round((activeEmployees / totalEmployees) * 100 * 10) / 10 : 0;

      return {
        total: totalEmployees,
        active: activeEmployees,
        inactive: inactiveEmployees,
        suspended: suspendedEmployees,
        activePercent,
        newThisMonth: employeesThisMonth,
        newLastMonth: employeesLastMonth,
        newEmployeesChange: parseFloat(newEmployeesChange),
        withWallet: employeesWithWallet,
        withoutWallet: employeesWithoutWallet,
        monthlyPayroll: monthlyPayroll.toFixed(2),
        avgSalary: avgSalary.toFixed(2),
        avgMonthlyPayrollPerEmployee: avgMonthlyPayrollPerEmployee.toFixed(2),
        departments: departmentStats,
        networks: networkStats,
      };
    } catch (error) {
      logger.error('Error getting employee stats:', error);
      throw error;
    }
  }
}

module.exports = new EmployeeService();


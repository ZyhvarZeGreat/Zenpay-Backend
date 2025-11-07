const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class AnalyticsService {
  /**
   * Get dashboard analytics
   */
  async getDashboardStats(network, startDate, endDate) {
    try {
      const where = {};
      const paymentWhere = {};
      const receiptWhere = {};

      if (network) {
        paymentWhere.network = network;
        receiptWhere.network = network;
      }

      if (startDate || endDate) {
        const dateFilter = {};
        if (startDate) dateFilter.gte = new Date(startDate);
        if (endDate) dateFilter.lte = new Date(endDate);
        paymentWhere.createdAt = dateFilter;
        receiptWhere.createdAt = dateFilter;
      }

      // Get current month date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisMonthWhere = { ...paymentWhere, createdAt: { gte: startOfMonth } };

      // Parallel queries
      const [
        totalEmployees,
        activeEmployees,
        totalPayments,
        completedPayments,
        pendingPayments,
        failedPayments,
        paymentsThisMonth,
        totalPaid,
        receiptsThisMonth,
        totalInvoices,
        pendingInvoices,
        paidInvoices,
      ] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({ where: { status: 'ACTIVE' } }),
        prisma.payment.count({ where: paymentWhere }),
        prisma.payment.count({ where: { ...paymentWhere, status: 'COMPLETED' } }),
        prisma.payment.count({ where: { ...paymentWhere, status: 'PENDING' } }),
        prisma.payment.count({ where: { ...paymentWhere, status: 'FAILED' } }),
        prisma.payment.count({ where: thisMonthWhere }),
        prisma.receipt.findMany({ where: receiptWhere, select: { amount: true } }),
        prisma.receipt.findMany({ where: { ...receiptWhere, createdAt: { gte: startOfMonth } }, select: { amount: true } }),
        prisma.invoice.count({ where: network ? { network } : {} }),
        prisma.invoice.count({ where: { ...(network ? { network } : {}), status: 'PENDING' } }),
        prisma.invoice.count({ where: { ...(network ? { network } : {}), status: 'PAID' } }),
      ]);

      // Calculate totals
      const totalPaidAmount = receiptsThisMonth.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const totalPaidAllTime = totalPaid.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);

      // Get recent payments
      const recentPayments = await prisma.payment.findMany({
        where: paymentWhere,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              firstName: true,
              lastName: true,
              walletAddress: true,
            },
          },
        },
      });

      // Get payment trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const paymentsByDay = await prisma.payment.findMany({
        where: {
          ...paymentWhere,
          createdAt: { gte: thirtyDaysAgo },
          status: 'COMPLETED',
        },
        select: {
          createdAt: true,
          amount: true,
        },
      });

      // Group by day
      const dailyTrends = paymentsByDay.reduce((acc, payment) => {
        const date = payment.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { date, count: 0, amount: 0 };
        }
        acc[date].count++;
        acc[date].amount += parseFloat(payment.amount || 0);
        return acc;
      }, {});

      return {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees,
        },
        payments: {
          total: totalPayments,
          completed: completedPayments,
          pending: pendingPayments,
          failed: failedPayments,
          thisMonth: paymentsThisMonth,
          successRate: totalPayments > 0 ? ((completedPayments / totalPayments) * 100).toFixed(2) : 0,
        },
        financials: {
          totalPaidThisMonth: totalPaidAmount.toString(),
          totalPaidAllTime: totalPaidAllTime.toString(),
          pendingInvoices: pendingInvoices,
          paidInvoices: paidInvoices,
        },
        recentPayments: recentPayments.map(p => ({
          id: p.id,
          employee: `${p.employee.firstName} ${p.employee.lastName}`,
          amount: p.amount,
          token: p.token,
          status: p.status,
          network: p.network,
          createdAt: p.createdAt,
        })),
        trends: {
          daily: Object.values(dailyTrends).sort((a, b) => new Date(a.date) - new Date(b.date)),
        },
      };
    } catch (error) {
      logger.error('Error getting dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get payment analytics by network
   */
  async getPaymentAnalyticsByNetwork(startDate, endDate) {
    try {
      const where = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const payments = await prisma.payment.findMany({
        where,
        select: {
          network: true,
          status: true,
          amount: true,
          token: true,
          gasUsed: true,
        },
      });

      // Group by network
      const byNetwork = payments.reduce((acc, payment) => {
        if (!acc[payment.network]) {
          acc[payment.network] = {
            network: payment.network,
            total: 0,
            completed: 0,
            failed: 0,
            pending: 0,
            totalAmount: 0,
            totalGas: 0,
            tokens: {},
          };
        }

        acc[payment.network].total++;
        if (payment.status === 'COMPLETED') acc[payment.network].completed++;
        if (payment.status === 'FAILED') acc[payment.network].failed++;
        if (payment.status === 'PENDING') acc[payment.network].pending++;
        acc[payment.network].totalAmount += parseFloat(payment.amount || 0);
        if (payment.gasUsed) {
          acc[payment.network].totalGas += parseFloat(payment.gasUsed);
        }

        if (!acc[payment.network].tokens[payment.token]) {
          acc[payment.network].tokens[payment.token] = 0;
        }
        acc[payment.network].tokens[payment.token] += parseFloat(payment.amount || 0);

        return acc;
      }, {});

      return Object.values(byNetwork);
    } catch (error) {
      logger.error('Error getting payment analytics by network:', error);
      throw error;
    }
  }

  /**
   * Get employee analytics
   */
  async getEmployeeAnalytics(department) {
    try {
      const where = {};
      if (department) {
        where.department = department.toUpperCase();
      }

      const employees = await prisma.employee.findMany({
        where,
        include: {
          payments: {
            select: {
              status: true,
              amount: true,
              createdAt: true,
            },
          },
        },
      });

      // Calculate statistics
      const stats = employees.map(emp => {
        const completedPayments = emp.payments.filter(p => p.status === 'COMPLETED');
        const totalPaid = completedPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        const lastPayment = completedPayments.length > 0
          ? completedPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0].createdAt
          : null;

        return {
          employeeId: emp.id,
          name: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          status: emp.status,
          totalPayments: emp.payments.length,
          completedPayments: completedPayments.length,
          totalPaid: totalPaid.toString(),
          lastPaymentDate: lastPayment,
          averagePayment: completedPayments.length > 0
            ? (totalPaid / completedPayments.length).toFixed(2)
            : '0',
        };
      });

      // Group by department
      const byDepartment = stats.reduce((acc, stat) => {
        if (!acc[stat.department]) {
          acc[stat.department] = {
            department: stat.department,
            count: 0,
            totalPaid: 0,
          };
        }
        acc[stat.department].count++;
        acc[stat.department].totalPaid += parseFloat(stat.totalPaid);
        return acc;
      }, {});

      return {
        employees: stats,
        byDepartment: Object.values(byDepartment),
      };
    } catch (error) {
      logger.error('Error getting employee analytics:', error);
      throw error;
    }
  }

  /**
   * Get financial summary
   */
  async getFinancialSummary(startDate, endDate) {
    try {
      const where = {};
      if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = new Date(startDate);
        if (endDate) where.createdAt.lte = new Date(endDate);
      }

      const [receipts, invoices, payments] = await Promise.all([
        prisma.receipt.findMany({ where, select: { amount: true, token: true, network: true } }),
        prisma.invoice.findMany({ where, select: { amount: true, token: true, status: true, network: true } }),
        prisma.payment.findMany({ where: { ...where, status: 'COMPLETED' }, select: { amount: true, token: true, network: true } }),
      ]);

      // Calculate totals by token
      const totalsByToken = {};
      [...receipts, ...payments].forEach(item => {
        if (!totalsByToken[item.token]) {
          totalsByToken[item.token] = { token: item.token, total: 0 };
        }
        totalsByToken[item.token].total += parseFloat(item.amount || 0);
      });

      // Calculate pending invoices
      const pendingInvoices = invoices
        .filter(inv => inv.status === 'PENDING')
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

      // Calculate by network
      const byNetwork = receipts.reduce((acc, receipt) => {
        if (!acc[receipt.network]) {
          acc[receipt.network] = { network: receipt.network, total: 0 };
        }
        acc[receipt.network].total += parseFloat(receipt.amount || 0);
        return acc;
      }, {});

      return {
        totalReceived: receipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0).toString(),
        totalPaid: payments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0).toString(),
        pendingInvoices: pendingInvoices.toString(),
        byToken: Object.values(totalsByToken),
        byNetwork: Object.values(byNetwork),
      };
    } catch (error) {
      logger.error('Error getting financial summary:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();


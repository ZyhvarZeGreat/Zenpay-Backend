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

  /**
   * Get analytics for charts
   */
  async getAnalyticsCharts() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

      // Get all payments for analysis
      const allPayments = await prisma.payment.findMany({
        select: {
          status: true,
          network: true,
          amount: true,
          createdAt: true,
        },
      });

      // Status distribution (for donut chart)
      const statusCounts = {
        COMPLETED: 0,
        PENDING: 0,
        PROCESSING: 0,
        FAILED: 0,
      };
      allPayments.forEach(p => {
        if (p.status === 'COMPLETED') statusCounts.COMPLETED++;
        else if (p.status === 'PENDING' || p.status === 'PROCESSING') statusCounts.PENDING++;
        else if (p.status === 'FAILED') statusCounts.FAILED++;
      });
      const total = allPayments.length;
      const statusDistribution = total > 0 ? {
        completed: Math.round((statusCounts.COMPLETED / total) * 100),
        pending: Math.round(((statusCounts.PENDING) / total) * 100),
        failed: Math.round((statusCounts.FAILED / total) * 100),
        cancelled: 0, // No cancelled status in payments
      } : { completed: 0, pending: 0, failed: 0, cancelled: 0 };

      // Network distribution (this month vs last month)
      const networkData = {
        ETHEREUM: { thisMonth: 0, lastMonth: 0 },
        POLYGON: { thisMonth: 0, lastMonth: 0 },
        BSC: { thisMonth: 0, lastMonth: 0 },
      };

      allPayments.forEach(p => {
        if (p.network && networkData[p.network]) {
          const paymentDate = new Date(p.createdAt);
          const amount = parseFloat(p.amount) || 0;
          
          if (paymentDate >= startOfMonth) {
            networkData[p.network].thisMonth += amount;
          } else if (paymentDate >= lastMonth && paymentDate <= endOfLastMonth) {
            networkData[p.network].lastMonth += amount;
          }
        }
      });

      // Monthly revenue (last 12 months)
      const monthlyRevenue = {};
      const monthlyRevenueLastYear = {};
      
      for (let i = 0; i < 12; i++) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        monthlyRevenue[monthKey] = 0;
        
        // Last year data
        const lastYearDate = new Date(now.getFullYear() - 1, now.getMonth() - i, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() - i + 1, 0);
        monthlyRevenueLastYear[monthKey] = 0;

        allPayments.forEach(p => {
          if (p.status === 'COMPLETED') {
            const paymentDate = new Date(p.createdAt);
            const amount = parseFloat(p.amount) || 0;
            
            if (paymentDate >= monthDate && paymentDate <= monthEnd) {
              monthlyRevenue[monthKey] += amount;
            }
            if (paymentDate >= lastYearDate && paymentDate <= lastYearEnd) {
              monthlyRevenueLastYear[monthKey] += amount;
            }
          }
        });
      }

      // Hourly transaction distribution (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const hourlyData = {
        '12a': 0, '3a': 0, '6a': 0, '9a': 0,
        '12p': 0, '3p': 0, '6p': 0, '9p': 0,
      };

      allPayments
        .filter(p => new Date(p.createdAt) >= thirtyDaysAgo)
        .forEach(p => {
          const hour = new Date(p.createdAt).getHours();
          if (hour === 0) hourlyData['12a']++;
          else if (hour >= 1 && hour < 3) hourlyData['3a']++;
          else if (hour >= 3 && hour < 6) hourlyData['6a']++;
          else if (hour >= 6 && hour < 9) hourlyData['9a']++;
          else if (hour >= 9 && hour < 12) hourlyData['12p']++;
          else if (hour >= 12 && hour < 15) hourlyData['3p']++;
          else if (hour >= 15 && hour < 18) hourlyData['6p']++;
          else if (hour >= 18 && hour < 21) hourlyData['9p']++;
          else hourlyData['12a']++; // Default to midnight
        });

      // Department analytics
      const employees = await prisma.employee.findMany({
        select: {
          department: true,
          status: true,
          createdAt: true,
        },
      });

      const departmentStats = {};
      employees.forEach(emp => {
        if (!departmentStats[emp.department]) {
          departmentStats[emp.department] = {
            name: emp.department,
            count: 0,
            active: 0,
          };
        }
        departmentStats[emp.department].count++;
        if (emp.status === 'ACTIVE') {
          departmentStats[emp.department].active++;
        }
      });

      const totalEmployees = employees.length;
      const departments = Object.values(departmentStats).map(dept => ({
        name: dept.name,
        count: dept.count,
        percent: totalEmployees > 0 ? Math.round((dept.count / totalEmployees) * 100 * 10) / 10 : 0,
      })).sort((a, b) => b.count - a.count).slice(0, 4);

      return {
        statusDistribution,
        networkDistribution: {
          labels: ['Ethereum', 'Polygon', 'BSC'],
          thisMonth: [
            Math.round(networkData.ETHEREUM.thisMonth / 1000),
            Math.round(networkData.POLYGON.thisMonth / 1000),
            Math.round(networkData.BSC.thisMonth / 1000),
          ],
          lastMonth: [
            Math.round(networkData.ETHEREUM.lastMonth / 1000),
            Math.round(networkData.POLYGON.lastMonth / 1000),
            Math.round(networkData.BSC.lastMonth / 1000),
          ],
        },
        monthlyRevenue: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          thisYear: Object.values(monthlyRevenue).reverse().map(v => Math.round(v / 1000)),
          lastYear: Object.values(monthlyRevenueLastYear).reverse().map(v => Math.round(v / 1000)),
        },
        hourlyDistribution: Object.values(hourlyData),
        departments,
      };
    } catch (error) {
      logger.error('Error getting analytics charts:', error);
      throw error;
    }
  }

  /**
   * Get token distribution for dashboard
   */
  async getTokenDistribution() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all completed payments this month
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
          createdAt: { gte: startOfMonth },
        },
        select: {
          token: true,
          amount: true,
        },
      });

      // Group by token
      const tokenTotals = {};
      let totalAmount = 0;

      payments.forEach(payment => {
        const token = payment.token || 'USDT';
        const amount = parseFloat(payment.amount || 0);
        
        if (!tokenTotals[token]) {
          tokenTotals[token] = 0;
        }
        tokenTotals[token] += amount;
        totalAmount += amount;
      });

      // Calculate percentages and format
      const tokens = ['USDT', 'USDC', 'DAI', 'ETH'];
      const distribution = tokens.map(token => {
        const amount = tokenTotals[token] || 0;
        const percent = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0;
        return {
          name: token,
          amount: amount.toFixed(2),
          percent,
        };
      });

      return {
        total: totalAmount.toFixed(2),
        distribution,
      };
    } catch (error) {
      logger.error('Error getting token distribution:', error);
      throw error;
    }
  }

  /**
   * Get network usage statistics with gas fees
   */
  async getNetworkUsage() {
    try {
      const payments = await prisma.payment.findMany({
        where: {
          status: 'COMPLETED',
        },
        select: {
          network: true,
          gasUsed: true,
          gasPrice: true,
        },
      });

      // Group by network
      const networkStats = {};
      let totalTransactions = 0;

      payments.forEach(payment => {
        const network = payment.network || 'ETHEREUM';
        if (!networkStats[network]) {
          networkStats[network] = {
            network,
            count: 0,
            totalGas: 0,
            gasFees: [],
          };
        }
        networkStats[network].count++;
        totalTransactions++;
        
        if (payment.gasUsed && payment.gasPrice) {
          // Calculate gas fee in USD (simplified: assuming ETH price ~$2000)
          // In production, you'd fetch current ETH price
          const gasFeeInEth = (parseFloat(payment.gasUsed) * parseFloat(payment.gasPrice)) / 1e18;
          const gasFeeInUsd = gasFeeInEth * 2000; // Approximate ETH price
          networkStats[network].totalGas += gasFeeInUsd;
          networkStats[network].gasFees.push(gasFeeInUsd);
        }
      });

      // Format results
      const networks = ['ETHEREUM', 'POLYGON', 'BSC'];
      const result = networks.map(network => {
        const stats = networkStats[network] || { count: 0, totalGas: 0, gasFees: [] };
        const percent = totalTransactions > 0 ? Math.round((stats.count / totalTransactions) * 100) : 0;
        const avgGas = stats.count > 0 ? (stats.totalGas / stats.count).toFixed(2) : '0.00';
        
        return {
          name: network.charAt(0) + network.slice(1).toLowerCase(),
          network: network,
          percent,
          count: stats.count,
          avgGas: `$${avgGas}`,
          totalGas: stats.totalGas.toFixed(2),
        };
      });

      return {
        totalTransactions,
        networks: result,
      };
    } catch (error) {
      logger.error('Error getting network usage:', error);
      throw error;
    }
  }

  /**
   * Get gas fees spent with month-over-month comparison
   */
  async getGasFeesStats() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get payments this month and last month
      const [thisMonthPayments, lastMonthPayments] = await Promise.all([
        prisma.payment.findMany({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startOfMonth },
          },
          select: {
            network: true,
            gasUsed: true,
            gasPrice: true,
          },
        }),
        prisma.payment.findMany({
          where: {
            status: 'COMPLETED',
            createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
          },
          select: {
            network: true,
            gasUsed: true,
            gasPrice: true,
          },
        }),
      ]);

      // Calculate gas fees (simplified: assuming ETH price ~$2000)
      const calculateGasFees = (payments) => {
        return payments.reduce((total, payment) => {
          if (payment.gasUsed && payment.gasPrice) {
            const gasFeeInEth = (parseFloat(payment.gasUsed) * parseFloat(payment.gasPrice)) / 1e18;
            const gasFeeInUsd = gasFeeInEth * 2000; // Approximate ETH price
            return total + gasFeeInUsd;
          }
          return total;
        }, 0);
      };

      const thisMonthGas = calculateGasFees(thisMonthPayments);
      const lastMonthGas = calculateGasFees(lastMonthPayments);
      const change = lastMonthGas > 0 
        ? ((thisMonthGas - lastMonthGas) / lastMonthGas * 100).toFixed(1)
        : '0';

      // Calculate savings from Polygon
      const polygonThisMonth = thisMonthPayments
        .filter(p => p.network === 'POLYGON')
        .reduce((total, payment) => {
          if (payment.gasUsed && payment.gasPrice) {
            const gasFeeInEth = (parseFloat(payment.gasUsed) * parseFloat(payment.gasPrice)) / 1e18;
            const gasFeeInUsd = gasFeeInEth * 2000;
            return total + gasFeeInUsd;
          }
          return total;
        }, 0);

      const ethereumThisMonth = thisMonthPayments
        .filter(p => p.network === 'ETHEREUM')
        .reduce((total, payment) => {
          if (payment.gasUsed && payment.gasPrice) {
            const gasFeeInEth = (parseFloat(payment.gasUsed) * parseFloat(payment.gasPrice)) / 1e18;
            const gasFeeInUsd = gasFeeInEth * 2000;
            return total + gasFeeInUsd;
          }
          return total;
        }, 0);

      // Estimate savings (Polygon is ~98% cheaper)
      const estimatedEthereumCost = polygonThisMonth * 50; // Rough estimate
      const saved = estimatedEthereumCost - polygonThisMonth;

      return {
        thisMonth: thisMonthGas.toFixed(2),
        lastMonth: lastMonthGas.toFixed(2),
        change: parseFloat(change),
        saved: saved > 0 ? saved.toFixed(2) : '0.00',
      };
    } catch (error) {
      logger.error('Error getting gas fees stats:', error);
      throw error;
    }
  }

  /**
   * Get month-over-month changes for dashboard metrics
   */
  async getMonthOverMonthChanges() {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Get payments this month and last month
      const [thisMonthPayments, lastMonthPayments, thisMonthReceipts, lastMonthReceipts] = await Promise.all([
        prisma.payment.findMany({
          where: { createdAt: { gte: startOfMonth } },
          select: { amount: true, status: true },
        }),
        prisma.payment.findMany({
          where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
          select: { amount: true, status: true },
        }),
        prisma.receipt.findMany({
          where: { createdAt: { gte: startOfMonth } },
          select: { amount: true },
        }),
        prisma.receipt.findMany({
          where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
          select: { amount: true },
        }),
      ]);

      // Calculate totals
      const thisMonthTotal = thisMonthReceipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const lastMonthTotal = lastMonthReceipts.reduce((sum, r) => sum + parseFloat(r.amount || 0), 0);
      const payrollChange = lastMonthTotal > 0 
        ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal * 100).toFixed(1)
        : '0';

      // Pending payments
      const thisMonthPending = thisMonthPayments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').length;
      const lastMonthPending = lastMonthPayments.filter(p => p.status === 'PENDING' || p.status === 'PROCESSING').length;
      const pendingChange = lastMonthPending > 0
        ? (thisMonthPending - lastMonthPending)
        : 0;

      return {
        payrollChange: parseFloat(payrollChange),
        pendingChange,
      };
    } catch (error) {
      logger.error('Error getting month-over-month changes:', error);
      throw error;
    }
  }
}

module.exports = new AnalyticsService();


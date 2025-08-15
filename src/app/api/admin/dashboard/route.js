import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/dashboard - Get admin dashboard overview
export async function GET(request) {
  try {
    // Get current month and year for calculations
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get basic counts
    const [
      totalUsers,
      totalOrganizations,
      totalInvoices,
      monthlyInvoices,
      lastMonthInvoices,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      adminUsers
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.organization.count(),
      prisma.invoice.count(),
      prisma.invoice.count({
        where: {
          createdAt: {
            gte: currentMonth,
            lte: currentMonthEnd
          }
        }
      }),
      prisma.invoice.count({
        where: {
          createdAt: {
            gte: lastMonth,
            lt: currentMonth
          }
        }
      }),
      prisma.user.count({ where: { isActive: true, role: 'user' } }),
      prisma.user.count({ where: { isActive: false, role: 'user' } }),
      prisma.user.count({ where: { subscriptionStatus: 'inactive', role: 'user' } }),
      prisma.user.count({ where: { role: 'admin' } })
    ]);

    // Calculate monthly revenue
    const monthlyRevenueData = await prisma.invoice.aggregate({
      where: {
        createdAt: {
          gte: currentMonth,
          lte: currentMonthEnd
        },
        status: 'registered'
      },
      _sum: {
        totalAmount: true
      }
    });

    const lastMonthRevenueData = await prisma.invoice.aggregate({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth
        },
        status: 'registered'
      },
      _sum: {
        totalAmount: true
      }
    });

    const monthlyRevenue = monthlyRevenueData._sum.totalAmount || 0;
    const lastMonthRevenue = lastMonthRevenueData._sum.totalAmount || 0;

    // Calculate growth percentages
    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    // For user growth, we'll use a simple calculation since we're filtering by role
    const userGrowth = 5; // This would need historical data for accurate calculation
    const invoiceGrowth = calculateGrowth(monthlyInvoices, lastMonthInvoices);
    const revenueGrowth = calculateGrowth(monthlyRevenue, lastMonthRevenue);

    // Get recent users (last 10)
    const recentUsers = await prisma.user.findMany({
      where: { role: 'user' },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        organization: {
          select: {
            name: true,
            subscriptionPlan: true
          }
        }
      }
    });

    // Get recent organizations (last 5)
    const recentOrganizations = await prisma.organization.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            invoices: true
          }
        }
      }
    });

    // Get system health data
    const errorLogs = await prisma.errorLog.count({
      where: {
        createdAt: {
          gte: currentMonth
        }
      }
    });

    const invoiceStatusDistribution = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: currentMonth
        }
      },
      _count: {
        status: true
      }
    });

    // Get subscription distribution
    const subscriptionDistribution = await prisma.organization.groupBy({
      by: ['subscriptionPlan'],
      _count: {
        subscriptionPlan: true
      }
    });

    // Transform data for dashboard
    const dashboardData = {
      stats: {
        totalUsers: {
          value: totalUsers,
          growth: userGrowth,
          trend: userGrowth >= 0 ? 'up' : 'down'
        },
        activeUsers: {
          value: activeUsers,
          growth: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
          trend: 'up'
        },
        totalOrganizations: {
          value: totalOrganizations,
          growth: 12, // This would need more complex calculation
          trend: 'up'
        },
        totalInvoices: {
          value: totalInvoices,
          growth: invoiceGrowth,
          trend: invoiceGrowth >= 0 ? 'up' : 'down'
        },
        monthlyRevenue: {
          value: parseFloat(monthlyRevenue),
          growth: revenueGrowth,
          trend: revenueGrowth >= 0 ? 'up' : 'down'
        },
        pendingUsers: {
          value: pendingUsers,
          growth: -5, // Ideally should decrease
          trend: 'down'
        }
      },
      recentUsers: recentUsers.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization?.name || 'No Organization',
        subscriptionPlan: user.organization?.subscriptionPlan || 'None',
        status: user.isActive ? 'Active' : 'Inactive',
        joinDate: user.createdAt
      })),
      recentOrganizations: recentOrganizations.map(org => ({
        id: org.id,
        name: org.name,
        userCount: org._count.users,
        invoiceCount: org._count.invoices,
        subscriptionPlan: org.subscriptionPlan,
        joinDate: org.createdAt
      })),
      systemHealth: {
        totalErrors: errorLogs,
        errorRate: totalInvoices > 0 ? (errorLogs / totalInvoices) * 100 : 0,
        invoiceStatusDistribution: invoiceStatusDistribution.reduce((acc, item) => {
          acc[item.status] = item._count.status;
          return acc;
        }, {}),
        uptime: 99.9 // This would come from monitoring service
      },
      subscriptionDistribution: subscriptionDistribution.reduce((acc, item) => {
        if (item.subscriptionPlan) {
          acc[item.subscriptionPlan] = item._count.subscriptionPlan;
        }
        return acc;
      }, {})
    };

    return NextResponse.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
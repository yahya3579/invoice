import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/analytics - Get admin dashboard analytics
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // day, week, month, year
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate date range based on period or custom dates
    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    } else {
      switch (period) {
        case 'day':
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), now.getDate())
          };
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);
          dateFilter = { gte: weekStart };
          break;
        case 'month':
          dateFilter = {
            gte: new Date(now.getFullYear(), now.getMonth(), 1)
          };
          break;
        case 'year':
          dateFilter = {
            gte: new Date(now.getFullYear(), 0, 1)
          };
          break;
      }
    }

    // Get overall statistics
    const [
      totalUsers,
      totalOrganizations,
      totalInvoices,
      activeUsers,
      recentInvoices,
      recentUsers,
      recentOrganizations,
      errorLogs
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Total organizations
      prisma.organization.count(),
      
      // Total invoices
      prisma.invoice.count(),
      
      // Active users (only role 'user')
      prisma.user.count({
        where: { isActive: true, role: 'user' }
      }),
      
      // Recent invoices in period
      prisma.invoice.findMany({
        where: {
          createdAt: dateFilter
        },
        include: {
          user: {
            select: { name: true, email: true }
          },
          organization: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Recent users in period
      prisma.user.findMany({
        where: {
          createdAt: dateFilter
        },
        include: {
          organization: {
            select: { name: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Recent organizations in period
      prisma.organization.findMany({
        where: {
          createdAt: dateFilter
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Error logs in period
      prisma.errorLog.findMany({
        where: {
          createdAt: dateFilter
        },
        include: {
          user: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    // Calculate revenue
    const totalRevenue = recentInvoices
      .filter(invoice => invoice.status === 'registered')
      .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount), 0);

    // Calculate invoice status distribution
    const invoiceStatusDistribution = recentInvoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {});

    // Calculate user role distribution
    const userRoleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    // Calculate organization business type distribution
    const organizationTypeDistribution = await prisma.organization.groupBy({
      by: ['businessType'],
      _count: {
        businessType: true
      }
    });

    // Calculate subscription status distribution
    const subscriptionStatusDistribution = await prisma.user.groupBy({
      by: ['subscriptionStatus'],
      _count: {
        subscriptionStatus: true
      }
    });

    // Calculate daily/weekly/monthly trends
    const trends = await calculateTrends(period, dateFilter);

    // Top organizations by invoice count and revenue
    const topOrganizations = await prisma.organization.findMany({
      include: {
        _count: {
          select: {
            invoices: true,
            users: true
          }
        },
        invoices: {
          where: {
            createdAt: dateFilter,
            status: 'registered'
          },
          select: {
            totalAmount: true
          }
        }
      },
      orderBy: {
        invoices: {
          _count: 'desc'
        }
      },
      take: 10
    });

    const topOrganizationsWithRevenue = topOrganizations.map(org => ({
      id: org.id,
      name: org.name,
      invoiceCount: org._count.invoices,
      userCount: org._count.users,
      revenue: org.invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0),
      subscriptionPlan: org.subscriptionPlan
    }));

    // System health metrics
    const systemHealth = {
      totalErrors: errorLogs.length,
      errorRate: totalInvoices > 0 ? (errorLogs.length / totalInvoices) * 100 : 0,
      successfulInvoices: recentInvoices.filter(inv => inv.status === 'registered').length,
      failedInvoices: recentInvoices.filter(inv => inv.status === 'failed').length,
      draftInvoices: recentInvoices.filter(inv => inv.status === 'draft').length
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalOrganizations,
          totalInvoices,
          activeUsers,
          totalRevenue,
          period
        },
        distributions: {
          invoiceStatus: invoiceStatusDistribution,
          userRoles: userRoleDistribution.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {}),
          organizationTypes: organizationTypeDistribution.reduce((acc, item) => {
            acc[item.businessType] = item._count.businessType;
            return acc;
          }, {}),
          subscriptionStatus: subscriptionStatusDistribution.reduce((acc, item) => {
            acc[item.subscriptionStatus] = item._count.subscriptionStatus;
            return acc;
          }, {})
        },
        trends,
        topOrganizations: topOrganizationsWithRevenue,
        systemHealth,
        recentActivity: {
          invoices: recentInvoices.slice(0, 10),
          users: recentUsers.slice(0, 10),
          organizations: recentOrganizations.slice(0, 10),
          errors: errorLogs.slice(0, 10)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

// Helper function to calculate trends
async function calculateTrends(period, dateFilter) {
  const groupBy = period === 'day' ? 'day' : 
                  period === 'week' ? 'week' : 
                  period === 'month' ? 'month' : 'year';

  // This is a simplified version - in a real app, you'd want more sophisticated date grouping
  const invoiceTrends = await prisma.invoice.groupBy({
    by: ['status'],
    where: {
      createdAt: dateFilter
    },
    _count: {
      id: true
    },
    _sum: {
      totalAmount: true
    }
  });

  const userTrends = await prisma.user.groupBy({
    by: ['role'],
    where: {
      createdAt: dateFilter
    },
    _count: {
      id: true
    }
  });

  return {
    invoices: invoiceTrends,
    users: userTrends
  };
}
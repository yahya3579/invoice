import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/subscriptions - Get subscription analytics and management data
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');
    
    const skip = (page - 1) * limit;

    // Build where conditions
    const where = {};
    
    if (status) {
      if (status === 'active') {
        where.subscriptionExpiresAt = {
          gt: new Date()
        };
      } else if (status === 'expired') {
        where.subscriptionExpiresAt = {
          lt: new Date()
        };
      } else if (status === 'expiring_soon') {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
        where.subscriptionExpiresAt = {
          gte: new Date(),
          lte: thirtyDaysFromNow
        };
      }
    }
    
    if (plan) {
      where.subscriptionPlan = plan;
    }

    // Get organizations with subscription data
    const organizations = await prisma.organization.findMany({
      where,
      skip,
      take: limit,
      include: {
        _count: {
          select: {
            users: true,
            invoices: true
          }
        },
        users: {
          where: { isActive: true },
          select: {
            id: true,
            subscriptionStatus: true
          }
        },
        invoices: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            },
            status: 'registered'
          },
          select: {
            totalAmount: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const totalSubscriptions = await prisma.organization.count({ where });

    // Calculate subscription pricing (this would typically come from a pricing table)
    const getSubscriptionPrice = (plan) => {
      const prices = {
        'standard': 10000
      };
      return prices[plan?.toLowerCase()] || 0;
    };

    // Transform data for subscriptions view
    const transformedSubscriptions = organizations.map(org => {
      const monthlyRevenue = org.invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
      const subscriptionPrice = getSubscriptionPrice(org.subscriptionPlan);
      
      let status = 'Inactive';
      if (org.subscriptionExpiresAt) {
        const now = new Date();
        const expiryDate = new Date(org.subscriptionExpiresAt);
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(now.getDate() + 30);
        
        if (expiryDate > now) {
          status = expiryDate <= thirtyDaysFromNow ? 'Expiring Soon' : 'Active';
        } else {
          status = 'Expired';
        }
      }

      return {
        id: org.id,
        organizationName: org.name,
        subscriptionPlan: org.subscriptionPlan || 'None',
        subscriptionPrice: subscriptionPrice,
        subscriptionExpiresAt: org.subscriptionExpiresAt,
        status: status,
        userCount: org._count.users,
        activeUsers: org.users.length,
        invoiceCount: org._count.invoices,
        monthlyRevenue: monthlyRevenue,
        monthlyTransactions: org.invoices.length,
        ntn: org.ntn,
        businessType: org.businessType,
        createdAt: org.createdAt
      };
    });

    // Calculate summary statistics
    const totalRevenue = transformedSubscriptions.reduce((sum, sub) => sum + sub.subscriptionPrice, 0);
    const activeSubscriptions = transformedSubscriptions.filter(sub => sub.status === 'Active').length;
    const expiringSoon = transformedSubscriptions.filter(sub => sub.status === 'Expiring Soon').length;
    const expiredSubscriptions = transformedSubscriptions.filter(sub => sub.status === 'Expired').length;

    // Get subscription plan distribution
    const planDistribution = await prisma.organization.groupBy({
      by: ['subscriptionPlan'],
      _count: {
        subscriptionPlan: true
      },
      where: {
        subscriptionPlan: {
          not: null
        }
      }
    });

    // Get upcoming renewals (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingRenewals = await prisma.organization.findMany({
      where: {
        subscriptionExpiresAt: {
          gte: new Date(),
          lte: thirtyDaysFromNow
        },
        subscriptionPlan: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        ntn: true
      },
      orderBy: {
        subscriptionExpiresAt: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        subscriptions: transformedSubscriptions,
        pagination: {
          page,
          limit,
          total: totalSubscriptions,
          totalPages: Math.ceil(totalSubscriptions / limit)
        },
        summary: {
          totalRevenue,
          activeSubscriptions,
          expiringSoon,
          expiredSubscriptions,
          totalSubscriptions
        },
        planDistribution: planDistribution.reduce((acc, item) => {
          acc[item.subscriptionPlan] = item._count.subscriptionPlan;
          return acc;
        }, {}),
        upcomingRenewals: upcomingRenewals.map(org => ({
          id: org.id,
          name: org.name,
          plan: org.subscriptionPlan,
          expiresAt: org.subscriptionExpiresAt,
          ntn: org.ntn,
          daysUntilExpiry: Math.ceil((new Date(org.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subscriptions - Update subscription (for bulk operations)
export async function PUT(request) {
  try {
    const body = await request.json();
    const { organizationIds, action, subscriptionPlan, expiryDate } = body;

    if (!organizationIds || !Array.isArray(organizationIds) || !action) {
      return NextResponse.json(
        { success: false, error: 'Organization IDs and action are required' },
        { status: 400 }
      );
    }

    let updateData = {};

    switch (action) {
      case 'extend':
        if (!expiryDate) {
          return NextResponse.json(
            { success: false, error: 'Expiry date is required for extend action' },
            { status: 400 }
          );
        }
        updateData.subscriptionExpiresAt = new Date(expiryDate);
        break;
        
      case 'upgrade':
        if (!subscriptionPlan) {
          return NextResponse.json(
            { success: false, error: 'Subscription plan is required for upgrade action' },
            { status: 400 }
          );
        }
        updateData.subscriptionPlan = subscriptionPlan;
        break;
        
      case 'suspend':
        updateData.subscriptionExpiresAt = new Date(); // Expire immediately
        break;
        
      case 'activate':
        if (!expiryDate) {
          const defaultExpiry = new Date();
          defaultExpiry.setMonth(defaultExpiry.getMonth() + 1);
          updateData.subscriptionExpiresAt = defaultExpiry;
        } else {
          updateData.subscriptionExpiresAt = new Date(expiryDate);
        }
        break;
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update organizations
    const updatedOrganizations = await prisma.organization.updateMany({
      where: {
        id: {
          in: organizationIds.map(id => parseInt(id))
        }
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}ed ${updatedOrganizations.count} subscription(s)`,
      data: {
        updatedCount: updatedOrganizations.count
      }
    });

  } catch (error) {
    console.error('Error updating subscriptions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subscriptions' },
      { status: 500 }
    );
  }
}
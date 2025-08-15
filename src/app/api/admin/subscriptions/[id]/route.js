import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/subscriptions/[id] - Get specific subscription details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const organizationId = parseInt(id);

    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            subscriptionStatus: true,
            isActive: true,
            createdAt: true
          }
        },
        invoices: {
          where: {
            status: 'registered'
          },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            users: true,
            invoices: true
          }
        }
      }
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Calculate subscription metrics
    const getSubscriptionPrice = (plan) => {
      const prices = {
        'standard': 10000
      };
      return prices[plan?.toLowerCase()] || 0;
    };

    const subscriptionPrice = getSubscriptionPrice(organization.subscriptionPlan);
    const totalRevenue = organization.invoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    
    // Calculate subscription status
    let status = 'Inactive';
    let daysUntilExpiry = null;
    
    if (organization.subscriptionExpiresAt) {
      const now = new Date();
      const expiryDate = new Date(organization.subscriptionExpiresAt);
      daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
      
      if (expiryDate > now) {
        status = daysUntilExpiry <= 30 ? 'Expiring Soon' : 'Active';
      } else {
        status = 'Expired';
      }
    }

    // Calculate usage metrics
    const usageMetrics = {
      totalUsers: organization._count.users,
      activeUsers: organization.users.filter(user => user.isActive).length,
      totalTransactions: organization._count.invoices,
      monthlyTransactions: organization.invoices.filter(inv => {
        const invDate = new Date(inv.createdAt);
        const now = new Date();
        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      }).length,
      totalRevenue,
      monthlyRevenue: organization.invoices
        .filter(inv => {
          const invDate = new Date(inv.createdAt);
          const now = new Date();
          return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
        })
        .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0)
    };

    // Get plan limits (these would typically come from a configuration)
    const getPlanLimits = (plan) => {
      const limits = {
        'standard': { users: 100, transactions: 10000 }
      };
      return limits[plan?.toLowerCase()] || { users: 0, transactions: 0 };
    };

    const planLimits = getPlanLimits(organization.subscriptionPlan);

    const subscriptionDetails = {
      id: organization.id,
      organizationName: organization.name,
      ntn: organization.ntn,
      address: organization.address,
      phone: organization.phone,
      email: organization.email,
      businessType: organization.businessType,
      subscription: {
        plan: organization.subscriptionPlan,
        price: subscriptionPrice,
        status: status,
        startDate: organization.createdAt,
        expiresAt: organization.subscriptionExpiresAt,
        daysUntilExpiry: daysUntilExpiry,
        autoRenew: false // This would come from subscription settings
      },
      usage: usageMetrics,
      limits: planLimits,
      users: organization.users,
      recentInvoices: organization.invoices.slice(0, 10),
      createdAt: organization.createdAt,
      updatedAt: organization.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: subscriptionDetails
    });

  } catch (error) {
    console.error('Error fetching subscription details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subscriptions/[id] - Update specific subscription
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const organizationId = parseInt(id);
    const body = await request.json();
    const { 
      subscriptionPlan, 
      subscriptionExpiresAt, 
      action 
    } = body;

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId }
    });

    if (!existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    let updateData = {};

    if (action) {
      switch (action) {
        case 'renew':
          // Extend subscription by the plan duration
          const currentExpiry = existingOrg.subscriptionExpiresAt || new Date();
          const newExpiry = new Date(currentExpiry);
          newExpiry.setMonth(newExpiry.getMonth() + 1); // Add 1 month
          updateData.subscriptionExpiresAt = newExpiry;
          break;
          
        case 'suspend':
          updateData.subscriptionExpiresAt = new Date(); // Expire immediately
          break;
          
        case 'upgrade':
          if (!subscriptionPlan) {
            return NextResponse.json(
              { success: false, error: 'Subscription plan is required for upgrade' },
              { status: 400 }
            );
          }
          updateData.subscriptionPlan = subscriptionPlan;
          break;
          
        case 'extend':
          if (!subscriptionExpiresAt) {
            return NextResponse.json(
              { success: false, error: 'Expiry date is required for extend action' },
              { status: 400 }
            );
          }
          updateData.subscriptionExpiresAt = new Date(subscriptionExpiresAt);
          break;
        case 'activate': {
          const base = new Date();
          const next = new Date(base);
          next.setMonth(next.getMonth() + 1);
          updateData.subscriptionExpiresAt = next;
          break;
        }
        case 'cancel':
          updateData.subscriptionPlan = null;
          updateData.subscriptionExpiresAt = null;
          break;
        case 'edit':
          if (subscriptionPlan !== undefined) updateData.subscriptionPlan = subscriptionPlan || null;
          if (subscriptionExpiresAt !== undefined) updateData.subscriptionExpiresAt = subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null;
          if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ success: false, error: 'No fields provided to edit' }, { status: 400 });
          }
          break;
        default:
          return NextResponse.json(
            { success: false, error: 'Invalid action' },
            { status: 400 }
          );
      }
    } else {
      // Direct update
      if (subscriptionPlan) updateData.subscriptionPlan = subscriptionPlan;
      if (subscriptionExpiresAt) updateData.subscriptionExpiresAt = new Date(subscriptionExpiresAt);
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            invoices: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      data: {
        id: updatedOrganization.id,
        name: updatedOrganization.name,
        subscriptionPlan: updatedOrganization.subscriptionPlan,
        subscriptionExpiresAt: updatedOrganization.subscriptionExpiresAt,
        userCount: updatedOrganization._count.users,
        invoiceCount: updatedOrganization._count.invoices,
        updatedAt: updatedOrganization.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
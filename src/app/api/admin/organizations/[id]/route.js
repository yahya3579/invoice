import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/organizations/[id] - Get organization details
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
            role: true,
            isActive: true,
            subscriptionStatus: true,
            fbrApiToken: true,
            createdAt: true,
            updatedAt: true
          },
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10
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

    // Calculate statistics
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyInvoices = organization.invoices.filter(
      invoice => new Date(invoice.createdAt) >= currentMonth
    );

    const monthlyRevenue = monthlyInvoices
      .filter(invoice => invoice.status === 'registered')
      .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount), 0);

    const activeUsers = organization.users.filter(user => user.isActive);
    const fbrTokens = organization.users.filter(user => user.fbrApiToken);

    // Transform response
    const transformedOrganization = {
      id: organization.id,
      name: organization.name,
      ntn: organization.ntn,
      address: organization.address,
      phone: organization.phone,
      email: organization.email,
      businessType: organization.businessType,
      subscriptionPlan: organization.subscriptionPlan,
      subscriptionExpiresAt: organization.subscriptionExpiresAt,
      status: organization.subscriptionExpiresAt ? 
        (organization.subscriptionExpiresAt > new Date() ? 'Active' : 'Expired') : 
        'Inactive',
      stats: {
        totalUsers: organization._count.users,
        activeUsers: activeUsers.length,
        totalInvoices: organization._count.invoices,
        monthlyInvoices: monthlyInvoices.length,
        monthlyRevenue,
        fbrTokensIssued: fbrTokens.length
      },
      users: organization.users,
      recentInvoices: organization.invoices,
      joinDate: organization.createdAt,
      updatedAt: organization.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: transformedOrganization
    });

  } catch (error) {
    console.error('Error fetching organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/organizations/[id] - Update organization
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const organizationId = parseInt(id);
    const body = await request.json();
    const {
      name,
      ntn,
      address,
      phone,
      email,
      businessType,
      subscriptionPlan,
      subscriptionExpiresAt
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

    // Check if NTN is being changed and if it's already taken
    if (ntn && ntn !== existingOrg.ntn) {
      const ntnExists = await prisma.organization.findUnique({
        where: { ntn }
      });

      if (ntnExists) {
        return NextResponse.json(
          { success: false, error: 'NTN already in use' },
          { status: 409 }
        );
      }
    }

    // Update organization
    const updatedOrganization = await prisma.organization.update({
      where: { id: organizationId },
      data: {
        ...(name && { name }),
        ...(ntn && { ntn }),
        ...(address && { address }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(businessType && { businessType: businessType.toLowerCase() }),
        ...(subscriptionPlan !== undefined && { subscriptionPlan }),
        ...(subscriptionExpiresAt !== undefined && { 
          subscriptionExpiresAt: subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null 
        })
      },
      include: {
        _count: {
          select: {
            users: true,
            invoices: true
          }
        }
      }
    });

    // Transform response
    const transformedOrganization = {
      id: updatedOrganization.id,
      name: updatedOrganization.name,
      ntn: updatedOrganization.ntn,
      address: updatedOrganization.address,
      phone: updatedOrganization.phone,
      email: updatedOrganization.email,
      businessType: updatedOrganization.businessType,
      subscriptionPlan: updatedOrganization.subscriptionPlan,
      subscriptionExpiresAt: updatedOrganization.subscriptionExpiresAt,
      status: updatedOrganization.subscriptionExpiresAt ? 
        (updatedOrganization.subscriptionExpiresAt > new Date() ? 'Active' : 'Expired') : 
        'Inactive',
      userCount: updatedOrganization._count.users,
      invoiceCount: updatedOrganization._count.invoices,
      joinDate: updatedOrganization.createdAt,
      updatedAt: updatedOrganization.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Organization updated successfully',
      data: transformedOrganization
    });

  } catch (error) {
    console.error('Error updating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/organizations/[id] - Delete organization
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const organizationId = parseInt(id);

    // Check if organization exists
    const existingOrg = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        _count: {
          select: {
            users: true,
            invoices: true
          }
        }
      }
    });

    if (!existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if organization has users or invoices
    if (existingOrg._count.users > 0 || existingOrg._count.invoices > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete organization with existing users or invoices. Please transfer or delete them first.' 
        },
        { status: 409 }
      );
    }

    // Delete organization
    await prisma.organization.delete({
      where: { id: organizationId }
    });

    return NextResponse.json({
      success: true,
      message: 'Organization deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
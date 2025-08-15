import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/organizations - List all organizations with filtering and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const subscriptionPlan = searchParams.get('subscriptionPlan');
    const businessType = searchParams.get('businessType');
    
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { ntn: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (subscriptionPlan) {
      where.subscriptionPlan = subscriptionPlan;
    }
    
    if (businessType) {
      where.businessType = businessType.toLowerCase();
    }

    // Get organizations with user count and revenue data
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
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            fbrApiToken: true
          }
        },
        invoices: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true
          },
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) // This month
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Aggregate total revenue per organization (all-time, registered invoices)
    const orgIds = organizations.map((o) => o.id);
    const revenueGrouped = orgIds.length > 0 ? await prisma.invoice.groupBy({
      by: ['organizationId'],
      where: { organizationId: { in: orgIds }, status: 'registered' },
      _sum: { totalAmount: true },
    }) : [];
    const revenueMap = new Map(revenueGrouped.map(r => [r.organizationId, parseFloat(r._sum.totalAmount || 0)]));

    // Get total count for pagination and global totals
    const [totalOrganizations, totalInvoicesAll, revenueAggAll] = await Promise.all([
      prisma.organization.count({ where }),
      prisma.invoice.count(),
      prisma.invoice.aggregate({
        _sum: { totalAmount: true },
        where: { status: 'registered' }
      })
    ]);

    // Transform data for frontend
    const transformedOrganizations = organizations.map(org => {
      const monthlyRevenue = org.invoices
        .filter(invoice => invoice.status === 'registered')
        .reduce((sum, invoice) => sum + parseFloat(invoice.totalAmount), 0);
      const totalRevenue = revenueMap.get(org.id) || 0;
      
      const status = org.subscriptionExpiresAt ? 
        (org.subscriptionExpiresAt > new Date() ? 'Active' : 'Expired') : 
        'Inactive';

      return {
        id: org.id,
        name: org.name,
        ntn: org.ntn,
        address: org.address,
        phone: org.phone,
        email: org.email,
        businessType: org.businessType,
        subscriptionPlan: org.subscriptionPlan,
        subscriptionExpiresAt: org.subscriptionExpiresAt,
        status,
        userCount: org._count.users,
        invoiceCount: org._count.invoices,
        monthlyTransactions: org.invoices.length,
        monthlyRevenue,
        totalRevenue,
        activeUsers: org.users.filter(user => user.isActive).length,
        fbrTokens: org.users.filter(user => user.fbrApiToken).map(user => user.fbrApiToken),
        joinDate: org.createdAt,
        updatedAt: org.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        organizations: transformedOrganizations,
        pagination: {
          page,
          limit,
          total: totalOrganizations,
          totalPages: Math.ceil(totalOrganizations / limit)
        },
        totals: {
          totalInvoicesAll,
          totalRevenueAll: parseFloat(revenueAggAll._sum.totalAmount || 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/organizations - Create new organization
export async function POST(request) {
  try {
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

    // Validate required fields
    if (!name || !ntn || !address || !businessType) {
      return NextResponse.json(
        { success: false, error: 'Name, NTN, address, and business type are required' },
        { status: 400 }
      );
    }

    // Check if NTN already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { ntn }
    });

    if (existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Organization with this NTN already exists' },
        { status: 409 }
      );
    }

    // Create organization
    const newOrganization = await prisma.organization.create({
      data: {
        name,
        ntn,
        address,
        phone,
        email,
        businessType: businessType.toLowerCase(),
        subscriptionPlan,
        subscriptionExpiresAt: subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null
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
      id: newOrganization.id,
      name: newOrganization.name,
      ntn: newOrganization.ntn,
      address: newOrganization.address,
      phone: newOrganization.phone,
      email: newOrganization.email,
      businessType: newOrganization.businessType,
      subscriptionPlan: newOrganization.subscriptionPlan,
      subscriptionExpiresAt: newOrganization.subscriptionExpiresAt,
      status: 'Active',
      userCount: newOrganization._count.users,
      invoiceCount: newOrganization._count.invoices,
      monthlyTransactions: 0,
      monthlyRevenue: 0,
      joinDate: newOrganization.createdAt,
      updatedAt: newOrganization.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'Organization created successfully',
      data: transformedOrganization
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
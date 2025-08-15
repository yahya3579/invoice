import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/admin/users - List all users with filtering and pagination
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const role = searchParams.get('role');
    const organizationId = searchParams.get('organizationId');
    
    const skip = (page - 1) * limit;
    
    // Build where conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { organization: { name: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    // Handle status filtering
    if (status && status !== 'all') {
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive' || status === 'pending') {
        where.isActive = false;
      } else if (status === 'suspended') {
        where.isActive = false;
        // You might want to add additional conditions for suspended users
        // For now, we'll treat suspended as inactive
      }
    }
    
    if (role) {
      where.role = role.toLowerCase();
    }
    
    if (organizationId) {
      where.organizationId = parseInt(organizationId);
    }

    // Get users with organization details
    const users = await prisma.user.findMany({
      where,
      skip,
      take: limit,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true
          }
        },
        _count: {
          select: {
            invoices: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });

    // Transform data for frontend
    const transformedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      subscriptionStatus: user.subscriptionStatus,
      fbrToken: user.fbrApiToken,
      organizationId: user.organizationId,
      organizationName: user.organization?.name || 'No Organization',
      subscriptionPlan: user.organization?.subscriptionPlan || 'None',
      invoiceCount: user._count.invoices,
      joinDate: user.createdAt,
      lastActive: user.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          page,
          limit,
          total: totalUsers,
          totalPages: Math.ceil(totalUsers / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/users - Create new user
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password,
      role = 'user',
      organizationId,
      fbrApiToken,
      isActive = true,
      subscriptionStatus = 'inactive'
    } = body;

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password for secure storage
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with both hashed and original passwords
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Store hashed password for authentication
        originalPassword: password, // Store original password for recovery
        role: role.toLowerCase(),
        organizationId: organizationId ? parseInt(organizationId) : null,
        fbrApiToken,
        isActive,
        subscriptionStatus: subscriptionStatus.toLowerCase()
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true
          }
        }
      }
    });

    // Transform response
    const transformedUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      isActive: newUser.isActive,
      subscriptionStatus: newUser.subscriptionStatus,
      fbrToken: newUser.fbrApiToken,
      organizationId: newUser.organizationId,
      organizationName: newUser.organization?.name || 'No Organization',
      subscriptionPlan: newUser.organization?.subscriptionPlan || 'None',
      joinDate: newUser.createdAt,
      lastActive: newUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      data: transformedUser
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
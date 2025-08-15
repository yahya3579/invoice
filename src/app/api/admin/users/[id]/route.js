import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/admin/users/[id] - Get user details
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            subscriptionPlan: true,
            ntn: true,
            address: true,
            phone: true,
            email: true
          }
        },
        _count: {
          select: {
            invoices: true,
            errorLogs: true
          }
        },
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            createdAt: true
          }
        },
        errorLogs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            errorCode: true,
            errorMessage: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Transform response
    const transformedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      subscriptionStatus: user.subscriptionStatus,
      fbrToken: user.fbrApiToken,
      organizationId: user.organizationId,
      organization: user.organization,
      stats: {
        totalInvoices: user._count.invoices,
        totalErrors: user._count.errorLogs
      },
      recentInvoices: user.invoices,
      recentErrors: user.errorLogs,
      joinDate: user.createdAt,
      lastActive: user.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: transformedUser
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const {
      name,
      email,
      role,
      organizationId,
      fbrApiToken,
      isActive,
      subscriptionStatus
    } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { success: false, error: 'Email already in use' },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role: role.toLowerCase() }),
        ...(organizationId !== undefined && { 
          organizationId: organizationId ? parseInt(organizationId) : null 
        }),
        ...(fbrApiToken !== undefined && { fbrApiToken }),
        ...(isActive !== undefined && { isActive }),
        ...(subscriptionStatus && { subscriptionStatus: subscriptionStatus.toLowerCase() })
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
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isActive: updatedUser.isActive,
      subscriptionStatus: updatedUser.subscriptionStatus,
      fbrToken: updatedUser.fbrApiToken,
      organizationId: updatedUser.organizationId,
      organizationName: updatedUser.organization?.name || 'No Organization',
      subscriptionPlan: updatedUser.organization?.subscriptionPlan || 'None',
      joinDate: updatedUser.createdAt,
      lastActive: updatedUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      data: transformedUser
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            invoices: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user has invoices (you might want to prevent deletion)
    if (existingUser._count.invoices > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete user with existing invoices. Please transfer or delete invoices first.' 
        },
        { status: 409 }
      );
    }

    // Delete user (this will cascade delete error logs due to FK constraint)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
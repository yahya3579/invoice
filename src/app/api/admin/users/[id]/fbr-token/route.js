import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/admin/users/[id]/fbr-token - Update user's FBR token
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();
    const { fbrApiToken } = body;

    // Validate FBR token format (basic validation)
    if (fbrApiToken && !fbrApiToken.startsWith('FBR-')) {
      return NextResponse.json(
        { success: false, error: 'Invalid FBR token format. Must start with "FBR-"' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true
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

    // Update FBR token
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fbrApiToken: fbrApiToken || null
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

    return NextResponse.json({
      success: true,
      message: 'FBR token updated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        fbrToken: updatedUser.fbrApiToken,
        organizationName: updatedUser.organization?.name || 'No Organization',
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating FBR token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update FBR token' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users/[id]/fbr-token - Generate new FBR token
export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseInt(id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          select: {
            id: true,
            name: true
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

    // Generate new FBR token
    const generateFBRToken = (organizationName, userId) => {
      const orgCode = organizationName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .substring(0, 3);
      
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const year = new Date().getFullYear();
      return `FBR-${orgCode}-${userId.toString().padStart(3, '0')}-${randomNum}-${year}`;
    };

    const organizationName = existingUser.organization?.name || 'ORG';
    const newFbrToken = generateFBRToken(organizationName, userId);

    // Update user with new FBR token
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fbrApiToken: newFbrToken
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

    return NextResponse.json({
      success: true,
      message: 'New FBR token generated successfully',
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        fbrToken: updatedUser.fbrApiToken,
        organizationName: updatedUser.organization?.name || 'No Organization',
        updatedAt: updatedUser.updatedAt
      }
    });

  } catch (error) {
    console.error('Error generating FBR token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate FBR token' },
      { status: 500 }
    );
  }
}
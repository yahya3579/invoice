import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";

export async function GET(req) {
  try {
    const token = await verifyToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const organizations = await prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        ntn: true,
        address: true,
        phone: true,
        email: true,
        businessType: true,
        subscriptionPlan: true,
        subscriptionExpiresAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizations" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const token = await verifyToken(req);
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      name,
      ntn,
      address,
      phone,
      email,
      businessType,
      subscriptionPlan,
      subscriptionExpiresAt,
    } = body;

    // Validate required fields
    if (!name || !ntn || !address) {
      return NextResponse.json(
        { error: "Name, NTN, and address are required" },
        { status: 400 }
      );
    }

    // Check if NTN already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { ntn },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: "Organization with this NTN already exists" },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        ntn,
        address,
        phone,
        email,
        businessType: businessType || "product",
        subscriptionPlan,
        subscriptionExpiresAt: subscriptionExpiresAt ? new Date(subscriptionExpiresAt) : null,
      },
    });

    return NextResponse.json({
      organization,
      message: "Organization created successfully",
    });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "Failed to create organization" },
      { status: 500 }
    );
  }
} 
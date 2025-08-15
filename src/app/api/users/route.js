import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// GET /api/users - List users (admin only)
export async function GET(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { organization: { select: { id: true, name: true } } },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/users - Create user (admin only)
export async function POST(req) {
  const auth = requireAdmin(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { name, email, password, role = "user", organizationId } = body;
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return NextResponse.json({ error: "Email already exists" }, { status: 409 });

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password,
        role,
        organizationId: organizationId ?? null,
      },
    });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}



import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSelfOrAdmin, requireAdmin } from "@/lib/auth";

// GET current user details (self or admin) — optional if needed later
export async function GET(_req, { params }) {
  const { id } = await params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      include: { organization: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: user });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT /api/users/[id] - Update user (self or admin)
export async function PUT(req, { params }) {
  const { id } = await params;
  const auth = requireSelfOrAdmin(req, id);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { name, email, password } = body;
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(password && { password }),
      },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Admin only
export async function DELETE(req, { params }) {
  const admin = requireAdmin(req);
  if (admin.error) return admin.error;
  const { id } = await params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}



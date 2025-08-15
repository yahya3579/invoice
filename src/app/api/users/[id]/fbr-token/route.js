import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

// PUT /api/users/[id]/fbr-token - Admin only
export async function PUT(req, { params }) {
  const admin = requireAdmin(req);
  if (admin.error) return admin.error;
  const { id } = await params;
  try {
    const body = await req.json();
    const { fbrApiToken } = body;
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: { fbrApiToken: fbrApiToken || null },
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}



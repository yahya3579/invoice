import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireSelfOrAdmin, requireAdmin, getTokenFromRequest } from "@/lib/auth";

// PUT /api/organizations/[id] - Allow admin or users within that organization to update limited fields
export async function PUT(req, { params }) {
  const { id } = await params;
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const allowedForUser = ["address", "phone", "email"]; // non-admin edits
  const isAdmin = user.role === "admin";
  const data = Object.fromEntries(
    Object.entries(body).filter(([k]) => (isAdmin ? true : allowedForUser.includes(k)))
  );
  try {
    const updated = await prisma.organization.update({
      where: { id: Number(id) },
      data,
    });
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}



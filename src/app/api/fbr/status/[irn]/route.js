import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

// GET /api/fbr/status/[irn]
export async function GET(req, { params }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { irn } = await params;
  const invoice = await prisma.invoice.findFirst({ where: { irn } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "admin" && invoice.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ success: true, data: { irn, status: invoice.status, fbrResponse: invoice.fbrResponse } });
}



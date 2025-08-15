import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

// POST /api/fbr/register - Register invoice with FBR (stub)
export async function POST(req) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { invoiceId } = body;
    const invoice = await prisma.invoice.findUnique({ where: { id: Number(invoiceId) } });
    if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    if (user.role !== "admin" && invoice.userId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Stub FBR integration: mark as registered with mock IRN
    const irn = `IRN-${invoice.id}-${Date.now()}`;
    const updated = await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "registered",
        irn,
        fbrResponse: { mock: true, registeredAt: new Date().toISOString() },
      },
    });
    return NextResponse.json({ success: true, data: { irn, invoiceId: updated.id } });
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}



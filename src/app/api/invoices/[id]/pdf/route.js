import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

export async function GET(req, { params }) {
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(id) } });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "admin" && invoice.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  // Stub: PDF generation not configured in backend runtime
  return NextResponse.json({
    error: "PDF generation not configured on server. Attach pdfPath during registration or implement server-side PDF.",
  }, { status: 501 });
}



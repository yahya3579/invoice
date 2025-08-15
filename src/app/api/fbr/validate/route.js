import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

// POST /api/fbr/validate - Validate invoice data (basic validation)
export async function POST(req) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { invoice } = body;
    if (!invoice) return NextResponse.json({ error: "Missing invoice" }, { status: 400 });
    const errors = [];
    if (!invoice.buyerNTNCNIC) errors.push("buyerNTNCNIC is required");
    if (!invoice.buyerBusinessName) errors.push("buyerBusinessName is required");
    if (!Array.isArray(invoice.items) || invoice.items.length === 0) errors.push("items are required");
    return NextResponse.json({ success: errors.length === 0, errors });
  } catch {
    return NextResponse.json({ error: "Validation failed" }, { status: 500 });
  }
}



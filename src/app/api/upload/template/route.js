import { NextResponse } from "next/server";

// GET /api/upload/template - Provide sample columns for Excel
export async function GET() {
  const columns = [
    "invoiceNumber",
    "buyerName",
    "buyerNtn",
    "buyerAddress",
    "invoiceDate",
    "dueDate",
    "currency",
    // Items can be split across columns (e.g., item1_description, item1_qty, ...)
  ];
  return NextResponse.json({ columns, note: "For bulk items, send via /api/invoices/bulk after parsing." });
}



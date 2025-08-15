import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import * as XLSX from "xlsx";

// POST /api/upload/excel - Upload Excel and parse rows (client sends file as base64 to keep server simple)
export async function POST(req) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const { fileBase64 } = body;
    if (!fileBase64) return NextResponse.json({ error: "fileBase64 is required" }, { status: 400 });
    const buffer = Buffer.from(fileBase64.split(",").pop(), "base64");
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    // Validate headers against expected template
    const expectedHeaders = [
      "buyerNTNCNIC",
      "buyerBusinessName",
      "buyerProvince",
      "buyerAddress",
      "buyerRegistrationType",
      "invoiceRefNo",
      "scenarioId",
      "hsCode",
      "productDescription",
      "rate",
      "uoM",
      "quantity",
      "totalValues",
      "valueSalesExcludingST",
      "fixedNotifiedValueOrRetailPrice",
      "salesTaxApplicable",
      "salesTaxWithheldAtSource",
      "extraTax",
      "furtherTax",
      "sroScheduleNo",
      "fedPayable",
      "discount",
      "saleType",
      "sroItemSerialNo",
    ];
    const sheetAoA = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
    const headerRow = (sheetAoA[0] || []).map((h) => String(h || "").trim());
    const matches =
      headerRow.length === expectedHeaders.length &&
      expectedHeaders.every((h, i) => h === headerRow[i]);
    if (!matches) {
      return NextResponse.json(
        { error: "File does not match required template. Please download the latest template.", expected: expectedHeaders, found: headerRow },
        { status: 400 }
      );
    }

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    return NextResponse.json({ success: true, rows });
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse excel" }, { status: 500 });
  }
}



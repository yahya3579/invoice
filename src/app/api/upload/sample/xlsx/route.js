import * as XLSX from "xlsx";

export async function GET() {
  const headers = [
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

  const rows = [
    ["1000000000000", "FERTILIZER MANUFAC IRS NEW", "Sindh", "Karachi", "Registered", "REF-0001", "SN001", "0101.2100", "product Description", "18%", "Numbers, pieces, units", 1, 0, 1000, 0, 18, 0, "", 120, "", 0, 0, "Goods at standard rate (default)", ""],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  XLSX.utils.book_append_sheet(wb, ws, "Invoices");

  const wbout = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(wbout, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="invoice_sample.xlsx"',
      "Cache-Control": "no-cache",
    },
  });
}



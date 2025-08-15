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

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  XLSX.utils.book_append_sheet(wb, ws, "Invoices");

  const wbout = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(wbout, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="invoice_template.xlsx"',
      "Cache-Control": "no-cache",
    },
  });
}



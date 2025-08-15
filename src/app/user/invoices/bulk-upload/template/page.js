export default function BulkTemplateInfo() {
  const headers = [
    'buyerNTNCNIC',
    'buyerBusinessName',
    'buyerProvince',
    'buyerAddress',
    'buyerRegistrationType',
    'invoiceRefNo',
    'scenarioId',
    'hsCode',
    'productDescription',
    'rate',
    'uoM',
    'quantity',
    'totalValues',
    'valueSalesExcludingST',
    'fixedNotifiedValueOrRetailPrice',
    'salesTaxApplicable',
    'salesTaxWithheldAtSource',
    'extraTax',
    'furtherTax',
    'sroScheduleNo',
    'fedPayable',
    'discount',
    'saleType',
    'sroItemSerialNo',
  ];
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-xl border bg-white shadow-lg p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">Bulk Upload Template</h1>
        <p className="text-sm text-gray-600">Your Excel should include the following headers in the first row:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {headers.map((h) => (
            <div key={h} className="rounded-md bg-blue-50 text-blue-800 px-3 py-2 text-sm border border-blue-200">{h}</div>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          Notes:
          <ul className="list-disc list-inside">
            <li>Each row represents one item of an invoice. Repeat buyer fields for additional items of the same invoice.</li>
            <li>Numeric fields (quantity, valueSalesExcludingST, totalValues, fixedNotifiedValueOrRetailPrice, salesTaxApplicable, salesTaxWithheldAtSource, furtherTax, fedPayable, discount) must be numeric.</li>
            <li>Leave optional fields empty if not applicable.</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <a href="/api/upload/template/xlsx" className="inline-flex items-center rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 shadow-sm">Download Template</a>
          <a href="/api/upload/sample/xlsx" className="inline-flex items-center rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 shadow-sm">Download Sample</a>
        </div>
      </div>
    </div>
  );
}



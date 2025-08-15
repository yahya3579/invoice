"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { uploadApi, invoiceApi } from "@/lib/api";
import { Upload } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function BulkUploadPage() {
  const [rows, setRows] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64 = reader.result;
          const res = await uploadApi.excel(base64);
          const parsed = res.rows || [];
          setRows(parsed);
          toast.success(`${parsed.length} row(s) parsed from file`);
        } catch (err) {
          const msg = err?.message || 'Failed to parse file';
          toast.error(msg.includes('does not match') ? 'File does not match requirements. Please download the template.' : 'Failed to parse file');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        toast.error("Error reading file");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast.error("Error processing file");
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!rows.length) {
      toast.error("Please upload a file first");
      return;
    }
    setCreating(true);
    try {
      // Map simple columns to API shape; expects items combined per row with defaults
      const invoices = rows.map((r) => ({
        buyerNTNCNIC: r.buyerNTNCNIC,
        buyerBusinessName: r.buyerBusinessName,
        buyerProvince: r.buyerProvince || "",
        buyerAddress: r.buyerAddress || "",
        buyerRegistrationType: r.buyerRegistrationType || "",
        invoiceRefNo: r.invoiceRefNo || "",
        scenarioId: r.scenarioId || "SN001",
        items: [
          {
            hsCode: r.hsCode || "",
            productDescription: r.productDescription || "",
            rate: r.rate || "",
            uoM: r.uoM || "",
            quantity: Number(r.quantity || 1),
            totalValues: Number(r.totalValues || 0),
            valueSalesExcludingST: Number(r.valueSalesExcludingST || 0),
            fixedNotifiedValueOrRetailPrice: Number(r.fixedNotifiedValueOrRetailPrice || 0),
            salesTaxApplicable: Number(r.salesTaxApplicable || 0),
            salesTaxWithheldAtSource: Number(r.salesTaxWithheldAtSource || 0),
            extraTax: r.extraTax || "",
            furtherTax: Number(r.furtherTax || 0),
            sroScheduleNo: r.sroScheduleNo || "",
            fedPayable: Number(r.fedPayable || 0),
            discount: Number(r.discount || 0),
            saleType: r.saleType || "",
            sroItemSerialNo: r.sroItemSerialNo || "",
          },
        ],
      }));
      await invoiceApi.bulkCreate({ invoices });
      toast.success("Invoices created successfully");
      setRows([]);
    } catch {
      toast.error("Bulk create failed");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Toaster position="top-center" />
      <Card className="w-full max-w-3xl border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="text-gray-900">Bulk Upload Invoices</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <input id="excel-file" className="sr-only" type="file" accept=".xlsx,.xls" onChange={handleFile} />
            <label
              htmlFor="excel-file"
              className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 cursor-pointer shadow-sm"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Choose Excel File"}
            </label>
            <div className="text-xs md:text-sm text-gray-600">
              {fileName ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-3 py-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {fileName}
                </span>
              ) : (
                <span className="text-gray-500 italic">No file chosen</span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {/* <Button asChild variant="outline" className="border-blue-200">
              <a href="/api/upload/template/xlsx">Download Template</a>
            </Button> */}
            <Button asChild variant="outline" className="border-blue-200">
              <a href="/api/upload/sample/xlsx">Download Template</a>
            </Button>
            <Button onClick={handleCreate} disabled={!rows.length || creating || uploading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {creating ? 'Creating...' : 'Create Invoices'}
            </Button>
          </div>
          <div className="text-sm text-gray-600">Parsed rows: {rows.length} · <a className="text-blue-600 hover:underline" href="/user/invoices/bulk-upload/template">View template details</a></div>
        </CardContent>
      </Card>
    </div>
  );
}



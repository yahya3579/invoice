"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast, { Toaster } from "react-hot-toast";
import { invoiceApi, fbrApi } from "@/lib/api";
// We'll dynamically import these in the click handler to avoid any bundling issues

export default function ViewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const printRef = useRef(null);

  const confirmToast = (message) =>
    new Promise((resolve) => {
      const id = toast.custom(
        (t) => (
          <div className="pointer-events-auto w-full max-w-sm rounded-lg border bg-white p-4 shadow-lg">
            <div className="text-sm font-medium text-gray-900 mb-2">{message}</div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                className="h-8"
                onClick={() => {
                  toast.dismiss(id);
                  resolve(false);
                }}
              >
                No
              </Button>
              <Button
                className="h-8 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  toast.dismiss(id);
                  resolve(true);
                }}
              >
                Yes, delete
              </Button>
            </div>
          </div>
        ),
        { duration: Infinity, position: "top-center" }
      );
    });

  const load = async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.get(id);
      setInvoice(res.data || null);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (id) load(); }, [id]);

  const handleRegisterFBR = async () => {
    if (!invoice) return;
    setRegistering(true);
    try {
      const res = await fbrApi.register(invoice.id);
      toast.success("Invoice registered with FBR");
      await load();
    } catch {
      toast.error('Error while registering');
    } finally { setRegistering(false); }
  };

  const handleDelete = async () => {
    const confirmed = await confirmToast('Are you sure you want to delete this invoice?');
    if (!confirmed) return;
    try {
      await invoiceApi.remove(id);
      toast.success('Invoice deleted successfully');
      setTimeout(() => router.push('/user/invoices/history'), 800);
    } catch (e) {
      toast.error('Error while deleting');
    }
  };

  const handleDownload = async () => {
    try {
      const element = printRef.current;
      if (!element) {
        toast.error("Nothing to export");
        return;
      }
      // Force simple colors to avoid unsupported OKLCH parsing in html2canvas
      element.classList.add('force-pdf-colors');
      await new Promise((r) => requestAnimationFrame(() => r()));
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= pageHeight;
      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight;
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight, undefined, "FAST");
        heightLeft -= pageHeight;
      }
      const fileName = `Invoice-${invoice?.invoiceRefNo || invoice?.invoiceNumber || id}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error("PDF generation failed", e);
      toast.error("Failed to generate PDF");
    } finally {
      const element = printRef.current;
      if (element) element.classList.remove('force-pdf-colors');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!invoice) return <div>Not found</div>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Toaster position="top-center" />
      <style jsx global>{`
        .force-pdf-colors, .force-pdf-colors * {
          background-image: none !important;
          background: #ffffff !important;
          box-shadow: none !important;
          color: #000000 !important;
          --background: #ffffff !important;
          --foreground: #000000 !important;
          --card: #ffffff !important;
          --card-foreground: #000000 !important;
          --popover: #ffffff !important;
          --popover-foreground: #000000 !important;
          --primary: #000000 !important;
          --primary-foreground: #ffffff !important;
          --secondary: #f3f4f6 !important;
          --secondary-foreground: #111827 !important;
          --muted: #f9fafb !important;
          --muted-foreground: #374151 !important;
          --accent: #f3f4f6 !important;
          --accent-foreground: #111827 !important;
          --border: #e5e7eb !important;
          --input: #e5e7eb !important;
          --ring: #3b82f6 !important;
        }
      `}</style>
      <div ref={printRef} className="w-full max-w-5xl">
      <Card className="w-full border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="text-gray-900"># Invoice Ref: {invoice.invoiceRefNo || '—'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Buyer Business Name</div>
              <div className="font-medium">{invoice.buyerBusinessName || invoice.buyerName || '—'}</div>
              <div className="text-sm">NTN/CNIC: {invoice.buyerNtnCnic || invoice.buyerNtn || '—'}</div>
              <div className="text-sm">Province: {invoice.buyerProvince || '—'}</div>
              <div className="text-sm">Address: {invoice.buyerAddress || '—'}</div>
              <div className="text-sm">Registration Type: {invoice.buyerRegistrationType || '—'}</div>
            </div>
            <div className="text-right space-y-1">
              <div className="text-sm text-gray-500">Totals</div>
              <div className="font-semibold">₨{Number(invoice.totalAmount || 0).toLocaleString()}</div>
              <div className="text-sm">Subtotal: ₨{Number(invoice.subtotal || 0).toLocaleString()}</div>
              <div className="text-sm">Tax: ₨{Number(invoice.taxAmount || 0).toLocaleString()}</div>
              <div className="text-sm capitalize">Status: {invoice.status}</div>
              <div className="text-sm">Scenario: {invoice.scenarioId || '—'}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm text-gray-500 mb-2">Items</div>
            {Array.isArray(invoice.items) && invoice.items.length > 0 ? (
              <div className="space-y-4">
                {invoice.items.map((it) => (
                  <div key={it.id} className="rounded-md border bg-white p-4 grid md:grid-cols-4 gap-3">
                    <div>
                      <div className="text-xs text-gray-500">HS Code</div>
                      <div className="text-sm">{it.hsCode || '—'}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-xs text-gray-500">Product Description</div>
                      <div className="text-sm">{it.productDescription || it.itemDescription || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Rate</div>
                      <div className="text-sm">{it.rate || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">UoM</div>
                      <div className="text-sm">{it.uom || it.uoM || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Quantity</div>
                      <div className="text-sm">{Number(it.quantity ?? 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Value Excl. ST</div>
                      <div className="text-sm">₨{Number(it.valueSalesExcludingST ?? it.unitPrice ?? 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Values</div>
                      <div className="text-sm">₨{Number(it.totalValues ?? 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Fixed Notified / Retail</div>
                      <div className="text-sm">₨{Number(it.fixedNotifiedValueOrRetailPrice ?? 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Sales Tax %</div>
                      <div className="text-sm">{Number(it.salesTaxApplicable ?? it.taxRate ?? 0)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Sales Tax Withheld</div>
                      <div className="text-sm">₨{Number(it.salesTaxWithheldAtSource ?? 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Extra Tax</div>
                      <div className="text-sm">{it.extraTax || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Further Tax</div>
                      <div className="text-sm">₨{Number(it.furtherTax ?? 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">SRO Schedule No</div>
                      <div className="text-sm">{it.sroScheduleNo || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">FED Payable</div>
                      <div className="text-sm">₨{Number(it.fedPayable ?? 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Discount</div>
                      <div className="text-sm">₨{Number(it.discount ?? 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Sale Type</div>
                      <div className="text-sm">{it.saleType || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">SRO Item Serial No</div>
                      <div className="text-sm">{it.sroItemSerialNo || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Tax Amount</div>
                      <div className="text-sm">₨{Number(it.taxAmount ?? 0).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Amount</div>
                      <div className="text-sm">₨{Number(it.totalAmount ?? 0).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">No items.</div>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            {invoice.status !== 'registered' && (
              <Button onClick={handleRegisterFBR} disabled={registering} className="bg-green-600 hover:bg-green-700 text-white">{registering ? 'Registering...' : 'Register with FBR'}</Button>
            )}
            <Button variant="outline" className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white" onClick={handleDownload}>Download</Button>
            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete}>Delete</Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}



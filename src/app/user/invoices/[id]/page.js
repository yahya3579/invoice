"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { invoiceApi, fbrApi, authApi } from "@/lib/api";
// We'll dynamically import these in the click handler to avoid any bundling issues

export default function ViewInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [fbrError, setFbrError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errorCodes, setErrorCodes] = useState([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoiceApi.get(id);
      setInvoice(res.data || null);
      setFbrError(null);
    } finally { setLoading(false); }
  }, [id]);

  // Function to refresh user token
  const refreshToken = async () => {
    try {
      const res = await authApi.refresh();
      if (res.success) {
        toast.success('Token refreshed successfully');
        // Reload invoice data to get updated FBR token status
        await load();
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      toast.error('Failed to refresh token. Please log out and log back in.');
    }
  };

  // Function to fetch FBR error codes
  const fetchErrorCodes = async (errorDetails) => {
    try {
      console.log('fetchErrorCodes called with:', errorDetails);
      let allCodes = [];
      
      // Extract error codes from missing fields
      if (errorDetails?.missingFields) {
        errorDetails.missingFields.forEach(field => {
          // Look for error codes in multiple formats:
          // "Error: 0102, 0104, 0105" or "0102, 0104, 0105" or just "0102"
          let match = field.match(/Error:\s*([\d,\s]+)/);
          if (!match) {
            // Try without "Error:" prefix
            match = field.match(/(\d{4}(?:\s*,\s*\d{4})*)/);
          }
          if (match) {
            const errorCodes = match[1].split(',').map(code => code.trim());
            allCodes.push(...errorCodes);
          }
        });
      }
      
      // Also check if error codes are in the error message itself
      if (errorDetails?.message) {
        let messageMatch = errorDetails.message.match(/Error:\s*([\d,\s]+)/);
        if (!messageMatch) {
          messageMatch = errorDetails.message.match(/(\d{4}(?:\s*,\s*\d{4})*)/);
        }
        if (messageMatch) {
          const codes = messageMatch[1].split(',').map(code => code.trim());
          allCodes.push(...codes);
        }
      }
      
      // Also check if error codes are in the briefDescription
      if (errorDetails?.briefDescription) {
        let briefMatch = errorDetails.briefDescription.match(/Error:\s*([\d,\s]+)/);
        if (!briefMatch) {
          briefMatch = errorDetails.briefDescription.match(/(\d{4}(?:\s*,\s*\d{4})*)/);
        }
        if (briefMatch) {
          const codes = briefMatch[1].split(',').map(code => code.trim());
          allCodes.push(...codes);
        }
      }
      
      // Remove duplicates and fetch error codes
      const uniqueCodes = [...new Set(allCodes)];
      if (uniqueCodes.length > 0) {
        console.log('All extracted error codes:', uniqueCodes);
        const res = await fbrApi.getErrorCodes(uniqueCodes.join(','));
        console.log('API response for error codes:', res);
        if (res.success) {
          setErrorCodes(res.data);
          console.log('Set error codes:', res.data);
        }
      } else {
        // Fallback: try to extract error codes from the entire errorDetails object as string
        const errorDetailsString = JSON.stringify(errorDetails);
        const fallbackMatch = errorDetailsString.match(/(\d{4}(?:\s*,\s*\d{4})*)/);
        if (fallbackMatch) {
          const fallbackCodes = fallbackMatch[1].split(',').map(code => code.trim());
          console.log('Fallback extracted error codes:', fallbackCodes);
          const res = await fbrApi.getErrorCodes(fallbackCodes.join(','));
          if (res.success) {
            setErrorCodes(res.data);
            console.log('Set error codes from fallback:', res.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching FBR error codes:', error);
    }
  };

  useEffect(() => { if (id) load(); }, [id, load]);
  
  // Clear error codes when invoice changes
  useEffect(() => {
    if (invoice) {
      setErrorCodes([]);
    }
  }, [invoice]);

  const handleRegisterFBR = async () => {
    if (!invoice) return;
    
    // Check if user has FBR token before proceeding
    if (!invoice?.user?.fbrApiToken) {
      toast.error('FBR API token not configured. Please contact administrator.', {
        duration: 5000,
        icon: '⚠️'
      });
      
      setFbrError({
        code: 'FBR_TOKEN_MISSING',
        message: 'FBR API token not configured',
        briefDescription: 'Your account does not have an FBR API token configured. This is required to register invoices with FBR.',
        details: {
          category: 'configuration',
          solution: 'Contact your administrator to configure the FBR API token for your account.'
        }
      });
      return; // Stop execution here
    }
    
    setRegistering(true);
    setFbrError(null);
    setErrorCodes([]);
    
    try {
      console.log('Attempting FBR registration for invoice:', invoice.id);
      const res = await fbrApi.register(invoice.id);
      console.log('FBR registration response:', res);
      
      if (res.success) {
        toast.success("Invoice registered with FBR successfully!");
        await load();
      } else {
        // Handle FBR error response
        setFbrError({
          code: res.errorCode,
          message: res.errorMessage,
          briefDescription: res.briefDescription,
          details: res.details
        });
        
        // Fetch error codes if available
        await fetchErrorCodes(res.details);
        
        toast.error(`FBR registration failed: ${res.errorMessage || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('FBR registration error:', error);
      
      // Handle specific error types
      if (error.message && error.message.includes('FBR API token not configured')) {
        toast.error('FBR API token not configured. Please contact administrator.', {
          duration: 5000,
          icon: '⚠️'
        });
        
        // Show a more detailed error message
        setFbrError({
          code: 'FBR_TOKEN_MISSING',
          message: 'FBR API token not configured',
          briefDescription: 'Your account does not have an FBR API token configured. This is required to register invoices with FBR.',
          details: {
            category: 'configuration',
            solution: 'Contact your administrator to configure the FBR API token for your account.'
          }
        });
      } else if (error.message && error.message.includes('Invoice validation failed')) {
        toast.error('Invoice validation failed. Please check all required fields.', {
          duration: 5000,
          icon: '⚠️'
        });
        
        setFbrError({
          code: 'VALIDATION_ERROR',
          message: 'Invoice validation failed',
          briefDescription: 'One or more required fields are missing or invalid.',
          details: {
            category: 'validation',
            solution: 'Please review and complete all required invoice fields before attempting FBR registration.'
          }
        });
        
        // Fetch error codes if available
        await fetchErrorCodes({
          missingFields: error.message ? [error.message] : [],
          message: error.message,
          briefDescription: error.message
        });
      } else {
        // Generic error handling
        const errorMessage = error.message || 'Unknown error occurred';
        toast.error(`Error while registering with FBR: ${errorMessage}`);
        
        setFbrError({
          code: 'UNKNOWN_ERROR',
          message: errorMessage,
          briefDescription: 'An unexpected error occurred during FBR registration.',
          details: {
            category: 'system',
            solution: 'Please try again later or contact support if the issue persists.'
          }
        });
      }
    } finally { 
      setRegistering(false); 
    }
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

  const handleSaveInvoice = async () => {
    if (!invoice) return;
    setSaving(true);
    setFbrError(null); // Clear previous errors
    setErrorCodes([]); // Clear error codes

    try {
      const res = await invoiceApi.update(invoice.id, invoice);
      if (res.success) {
        toast.success('Invoice fields updated successfully!');
        await load(); // Reload to get updated FBR token status
      } else {
        setFbrError({
          code: res.errorCode,
          message: res.errorMessage,
          briefDescription: res.briefDescription,
          details: res.details
        });
        toast.error(`Failed to update invoice fields: ${res.errorMessage || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating invoice fields:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      toast.error(`Error while saving invoice fields: ${errorMessage}`);
      setFbrError({
        code: 'UNKNOWN_ERROR',
        message: errorMessage,
        briefDescription: 'An unexpected error occurred while saving invoice fields.',
        details: {
          category: 'system',
          solution: 'Please try again later or contact support if the issue persists.'
        }
      });
    } finally {
      setSaving(false);
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-gray-900"># Invoice Ref: {invoice.invoiceRefNo || '—'}</CardTitle>
              <div className="flex items-center gap-2">
                {invoice.status === 'registered' && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Registered
                  </Badge>
                )}
                {invoice.fbrErrorCode && (
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    <XCircle className="w-4 h-4 mr-1" />
                    FBR Error
                  </Badge>
                )}
                {invoice.irn && (
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    <Info className="w-4 h-4 mr-1" />
                    IRN: {invoice.irn}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4 p-6">
            {/* FBR Error Display */}
            {fbrError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <div className="font-semibold">FBR Registration Failed</div>
                    {fbrError.code && (
                      <div className="text-sm">
                        <span className="font-medium">Error Code:</span> {fbrError.code}
                      </div>
                    )}
                    {fbrError.message && (
                      <div className="text-sm">
                        <span className="font-medium">Error Message:</span> {fbrError.message}
                      </div>
                    )}
                    {fbrError.briefDescription && (
                      <div className="text-sm">
                        <span className="font-medium">Description:</span> {fbrError.briefDescription}
                      </div>
                    )}
                    {fbrError.details && (
                      <div className="text-sm">
                        <span className="font-medium">Category:</span> {fbrError.details.category}
                      </div>
                    )}
                    {/* Show missing fields for validation errors */}
                    {fbrError.details?.missingFields && fbrError.details.missingFields.length > 0 && (
                      <div className="bg-red-100 p-3 rounded border border-red-200">
                        <div className="font-medium mb-2">Missing or Invalid Fields ({fbrError.details.fieldCount}):</div>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          {fbrError.details.missingFields.map((field, index) => (
                            <li key={index} className="text-red-700">{field}</li>
                          ))}
                        </ul>
                        
                        
                        
                        {/* Show FBR Error Codes with Messages */}
                        {errorCodes.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-red-300">
                            <div className="font-medium mb-2 text-red-800">FBR Error Details:</div>
                            <div className="space-y-2">
                              {errorCodes.map((errorCode, index) => (
                                <div key={index} className="bg-red-50 p-2 rounded border border-red-200">
                                  <div className="text-xs font-medium text-red-800">
                                    Error {errorCode.code}: {errorCode.message}
                                  </div>
                                  {errorCode.briefDescription && (
                                    <div className="text-xs text-red-700 mt-1">
                                      {errorCode.briefDescription}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {fbrError.details?.solution && (
                      <div className="text-sm">
                        <span className="font-medium">Solution:</span> {fbrError.details.solution}
                      </div>
                    )}
                    
                    
                    {/* Show FBR Error Codes with Messages (when not in missing fields) */}
                    {errorCodes.length > 0 && !fbrError.details?.missingFields && (
                      <div className="mt-3 pt-3 border-t border-red-300">
                        <div className="font-medium mb-2 text-red-800">FBR Error Details:</div>
                        <div className="space-y-2">
                          {errorCodes.map((errorCode, index) => (
                            <div key={index} className="bg-red-50 p-2 rounded border border-red-200">
                              <div className="text-xs font-medium text-red-800">
                                Error {errorCode.code}: {errorCode.message}
                              </div>
                              {errorCode.briefDescription && (
                                <div className="text-xs text-red-700 mt-1">
                                  {errorCode.briefDescription}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Existing FBR Error Display */}
            {invoice.fbrErrorCode && !fbrError && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  <div className="space-y-2">
                    <div className="font-semibold">Previous FBR Registration Failed</div>
                    <div className="text-sm">
                      <span className="font-medium">Error Code:</span> {invoice.fbrErrorCode}
                    </div>
                    {invoice.fbrErrorMessage && (
                      <div className="text-sm">
                        <span className="font-medium">Error Message:</span> {invoice.fbrErrorMessage}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Debug FBR Fields */}
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-2">Debug: FBR Field Values</div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-medium">Invoice Number:</span> {invoice.invoiceNumber || 'null'}
                </div>
                <div>
                  <span className="font-medium">Invoice Type:</span> {invoice.invoiceType || 'null'}
                </div>
                <div>
                  <span className="font-medium">SRO Schedule No:</span> {invoice.sroScheduleNo || 'null'}
                </div>
                <div>
                  <span className="font-medium">ST Withheld:</span> {invoice.salesTaxWithheldAtSource !== null ? invoice.salesTaxWithheldAtSource : 'null'}
                </div>
                <div>
                  <span className="font-medium">Further Tax:</span> {invoice.furtherTax !== null ? invoice.furtherTax : 'null'}
                </div>
                <div>
                  <span className="font-medium">Fixed Value:</span> {invoice.fixedNotifiedValueOrRetailPrice !== null ? invoice.fixedNotifiedValueOrRetailPrice : 'null'}
                </div>
              </div>
            </div>

            {/* Complete Invoice Information Display */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Seller Profile Section */}
              <div className="space-y-3">
                <div className="text-lg font-semibold text-gray-800 border-b pb-2">Seller Profile</div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Organization Name</div>
                  <div className="font-medium">{invoice.organization?.name || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Seller NTN/CNIC</div>
                  <div className="font-medium">{invoice.organization?.ntn || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Seller Address</div>
                  <div className="font-medium">{invoice.organization?.address || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Business Type</div>
                  <div className="font-medium capitalize">{invoice.organization?.businessType || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Default Invoice Type</div>
                  <div className="font-medium">{invoice.user?.profile?.invoiceType || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Default Invoice Date</div>
                  <div className="font-medium">{invoice.user?.profile?.invoiceDate ? new Date(invoice.user.profile.invoiceDate).toLocaleDateString() : '—'}</div>
                  
                  <div className="text-sm text-gray-500">Seller NTN/CNIC</div>
                  <div className="font-medium">{invoice.user?.profile?.sellerNTNCNIC || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Seller Business Name</div>
                  <div className="font-medium">{invoice.user?.profile?.sellerBusinessName || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Seller Province</div>
                  <div className="font-medium">{invoice.user?.profile?.sellerProvince || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Seller Address</div>
                  <div className="font-medium">{invoice.user?.profile?.sellerAddress || '—'}</div>
                </div>
              </div>

              {/* Invoice Details Section */}
              <div className="space-y-3">
                <div className="text-lg font-semibold text-gray-800 border-b pb-2">Invoice Details</div>
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Invoice Number</div>
                  <div className="font-medium">{invoice.invoiceNumber || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Invoice Type</div>
                  <div className="font-medium">{invoice.invoiceType || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Invoice Date</div>
                  <div className="font-medium">{invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString() : '—'}</div>
                  
                  <div className="text-sm text-gray-500">SRO/Schedule Number</div>
                  <div className="font-medium">{invoice.sroScheduleNo || '—'}</div>
                  
                  <div className="text-sm text-gray-500">ST Withheld at Source</div>
                  <div className="font-medium">₨{Number(invoice.salesTaxWithheldAtSource ?? 0).toLocaleString()}</div>
                  
                  <div className="text-sm text-gray-500">Further Tax</div>
                  <div className="font-medium">₨{Number(invoice.furtherTax ?? 0).toLocaleString()}</div>
                  
                  <div className="text-sm text-gray-500">Fixed/Notified Value</div>
                  <div className="font-medium">₨{Number(invoice.fixedNotifiedValueOrRetailPrice ?? 0).toLocaleString()}</div>
                  
                  <div className="text-sm text-gray-500">Currency</div>
                  <div className="font-medium">{invoice.currency || 'PKR'}</div>
                  
                  <div className="text-sm text-gray-500">Status</div>
                  <div className="font-medium capitalize">{invoice.status || '—'}</div>
                </div>
              </div>
            </div>

            {/* Buyer Information Section */}
            <div className="space-y-3">
              <div className="text-lg font-semibold text-gray-800 border-b pb-2">Buyer Information</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Buyer Business Name</div>
                  <div className="font-medium">{invoice.buyerBusinessName || invoice.buyerName || '—'}</div>
                  
                  <div className="text-sm text-gray-500">NTN/CNIC</div>
                  <div className="font-medium">{invoice.buyerNtnCnic || invoice.buyerNtn || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Province</div>
                  <div className="font-medium">{invoice.buyerProvince || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="font-medium">{invoice.buyerAddress || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Registration Type</div>
                  <div className="font-medium">{invoice.buyerRegistrationType || '—'}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-500">Invoice Ref No</div>
                  <div className="font-medium">{invoice.invoiceRefNo || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Scenario ID</div>
                  <div className="font-medium">{invoice.scenarioId || '—'}</div>
                  
                  <div className="text-sm text-gray-500">Due Date</div>
                  <div className="font-medium">{invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : '—'}</div>
                </div>
              </div>
            </div>

            {/* Financial Summary Section */}
            <div className="space-y-3">
              <div className="text-lg font-semibold text-gray-800 border-b pb-2">Financial Summary</div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-500">Subtotal</div>
                  <div className="text-xl font-bold text-blue-600">₨{Number(invoice.subtotal || 0).toLocaleString()}</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-500">Tax Amount</div>
                  <div className="text-xl font-bold text-green-600">₨{Number(invoice.taxAmount || 0).toLocaleString()}</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-sm text-gray-500">Total Amount</div>
                  <div className="text-xl font-bold text-purple-600">₨{Number(invoice.totalAmount || 0).toLocaleString()}</div>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <div className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Invoice Items</div>
              {Array.isArray(invoice.items) && invoice.items.length > 0 ? (
                <div className="space-y-4">
                  {invoice.items.map((it, index) => (
                    <div key={it.id} className="rounded-lg border bg-white p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Item {index + 1}</h3>
                        <div className="text-sm text-gray-500">ID: {it.id}</div>
                      </div>
                      
                      <div className="grid md:grid-cols-4 gap-4">
                        {/* Basic Product Information */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">Product Details</div>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">HS Code</div>
                            <div className="text-sm font-medium">{it.hsCode || '—'}</div>
                            
                            <div className="text-xs text-gray-500">Product Description</div>
                            <div className="text-sm font-medium">{it.productDescription || it.itemDescription || '—'}</div>
                            
                            <div className="text-xs text-gray-500">Sale Type</div>
                            <div className="text-sm font-medium">{it.saleType || '—'}</div>
                          </div>
                        </div>
                        
                        {/* Quantity and Pricing */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">Quantity & Pricing</div>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">Rate</div>
                            <div className="text-sm font-medium">{it.rate || '—'}</div>
                            
                            <div className="text-xs text-gray-500">UoM</div>
                            <div className="text-sm font-medium">{it.uom || it.uoM || '—'}</div>
                            
                            <div className="text-xs text-gray-500">Quantity</div>
                            <div className="text-sm font-medium">{Number(it.quantity ?? 0)}</div>
                            
                            <div className="text-xs text-gray-500">Unit Price</div>
                            <div className="text-sm font-medium">₨{Number(it.unitPrice ?? 0).toLocaleString()}</div>
                          </div>
                        </div>
                        
                        {/* Tax Information */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">Tax Details</div>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">Sales Tax %</div>
                            <div className="text-sm font-medium">{Number(it.salesTaxApplicable ?? it.taxRate ?? 0)}%</div>
                            
                            <div className="text-xs text-gray-500">Tax Amount</div>
                            <div className="text-sm font-medium">₨{Number(it.taxAmount ?? 0).toLocaleString()}</div>
                            
                            <div className="text-xs text-gray-500">Extra Tax</div>
                            <div className="text-sm font-medium">{it.extraTax || '—'}</div>
                            
                            <div className="text-xs text-gray-500">FED Payable</div>
                            <div className="text-sm font-medium">₨{Number(it.fedPayable ?? 0).toLocaleString()}</div>
                          </div>
                        </div>
                        
                        {/* Financial Values */}
                        <div className="space-y-2">
                          <div className="text-xs text-gray-500 font-medium">Financial Values</div>
                          <div className="space-y-1">
                            <div className="text-xs text-gray-500">Value Excl. ST</div>
                            <div className="text-sm font-medium">₨{Number(it.valueSalesExcludingST ?? it.unitPrice ?? 0).toLocaleString()}</div>
                            
                            <div className="text-xs text-gray-500">Total Values</div>
                            <div className="text-sm font-medium">₨{Number(it.totalValues ?? 0).toLocaleString()}</div>
                            
                            <div className="text-xs text-gray-500">Total Amount</div>
                            <div className="text-sm font-medium">₨{Number(it.totalAmount ?? 0).toLocaleString()}</div>
                            
                            <div className="text-xs text-gray-500">Discount</div>
                            <div className="text-sm font-medium">₨{Number(it.discount ?? 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* FBR Specific Fields */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-xs text-gray-500 font-medium mb-2">FBR Required Fields</div>
                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Fixed/Notified Value</div>
                            <div className="text-sm font-medium">₨{Number(it.fixedNotifiedValueOrRetailPrice ?? 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">ST Withheld at Source</div>
                            <div className="text-sm font-medium">₨{Number(it.salesTaxWithheldAtSource ?? 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Further Tax</div>
                            <div className="text-sm font-medium">₨{Number(it.furtherTax ?? 0).toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">SRO Schedule No</div>
                            <div className="text-sm font-medium">{it.sroScheduleNo || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">SRO Item Serial No</div>
                            <div className="text-sm font-medium">{it.sroItemSerialNo || '—'}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-lg font-medium">No items found</div>
                  <div className="text-sm">This invoice doesn't have any items yet.</div>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 justify-end mt-4">
              {/* FBR Requirements Information */}
              
              
              {/* FBR Token Information */}
              {invoice?.user && !invoice.user.fbrApiToken && (
                <div className="flex-1">
                  <Alert className="border-red-200 bg-red-50">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium">FBR Registration Blocked:</span> Your account does not have an FBR API token configured. 
                          This is required to register invoices with FBR.
                        </div>
                        <div className="bg-red-100 p-2 rounded border border-red-200">
                          <strong>Next Steps:</strong>
                          <ul className="list-disc list-inside mt-1 space-y-1">
                            <li>Contact your system administrator</li>
                            <li>Request FBR API token configuration</li>
                            <li>Provide your FBR account credentials</li>
                            <li>Wait for token to be configured</li>
                            <li>Click "Refresh Token" button below</li>
                            <li>Or refresh this page after configuration</li>
                          </ul>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            onClick={refreshToken}
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                          >
                            Refresh Token
                          </Button>
                          <Button 
                            onClick={() => window.location.reload()}
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                          >
                            Reload Page
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {invoice?.user && invoice.user.fbrApiToken && (
                <div className="flex-1">
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium">FBR Ready:</span> Your account is configured with an FBR API token. 
                          You can now register invoices with FBR.
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            onClick={refreshToken}
                            variant="outline" 
                            size="sm"
                            className="text-xs text-green-700 border-green-300 hover:bg-green-100"
                          >
                            Refresh Token
                          </Button>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {/* Loading State */}
              {!invoice?.user && (
                <div className="flex-1">
                  <Alert className="border-gray-200 bg-gray-50">
                    <Info className="h-4 w-4 text-gray-600" />
                    <AlertDescription className="text-gray-800">
                      <div className="text-sm">
                        <span className="font-medium">Loading:</span> Checking FBR token status...
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              
              {invoice.status !== 'registered' && (
                <Button 
                  onClick={handleRegisterFBR} 
                  disabled={registering || !invoice?.user?.fbrApiToken} 
                  className={`${
                    !invoice?.user?.fbrApiToken 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  } text-white`}
                  title={
                    !invoice?.user?.fbrApiToken 
                      ? "FBR API token not configured. Please contact administrator to configure this." 
                      : "Click to register invoice with FBR"
                  }
                >
                  {registering ? 'Registering...' : 'Register with FBR'}
                </Button>
              )}
              <Button 
                variant="outline" 
                className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white" 
                onClick={handleDownload}
              >
                Download
              </Button>
              <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 text-white" 
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



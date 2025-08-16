"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { invoiceApi, fbrApi } from "@/lib/api";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function CreateInvoicePage() {
  const router = useRouter();
  const [sellerProfile, setSellerProfile] = useState(null);
  const [form, setForm] = useState({
    invoiceNumber: "",
    irn: "",
    invoiceType: "",
    sroScheduleNo: "",
    salesTaxWithheldAtSource: "",
    furtherTax: "",
    fixedNotifiedValueOrRetailPrice: "",
    invoiceDate: new Date().toISOString().slice(0,10),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10), // 30 days from now
    currency: "PKR",
    buyerNTNCNIC: "",
    buyerBusinessName: "",
    buyerProvince: "",
    buyerAddress: "",
    buyerRegistrationType: "",
    invoiceRefNo: "",
    scenarioId: "SN001",
  });
  const [items, setItems] = useState([
    {
      hsCode: "",
      productDescription: "",
      rate: "",
      uom: "",
      quantity: 1,
      totalValues: 0,
      valueSalesExcludingST: 0,
      fixedNotifiedValueOrRetailPrice: 0,
      salesTaxApplicable: 0,
      salesTaxWithheldAtSource: 0,
      extraTax: "",
      furtherTax: 0,
      sroScheduleNo: "",
      fedPayable: 0,
      discount: 0,
      saleType: "",
      sroItemSerialNo: "",
    },
  ]);
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const numericKeys = new Set([
    "quantity",
    "totalValues",
    "valueSalesExcludingST",
    "fixedNotifiedValueOrRetailPrice",
    "salesTaxApplicable",
    "salesTaxWithheldAtSource",
    "furtherTax",
    "fedPayable",
    "discount",
  ]);

  const updateItem = (idx, k, v) =>
    setItems((arr) =>
      arr.map((it, i) => (i === idx ? { ...it, [k]: numericKeys.has(k) ? Number(v || 0) : v } : it))
    );
  const addItem = () =>
    setItems((arr) => [
      ...arr,
      {
        hsCode: "",
        productDescription: "",
        rate: "",
        uom: "",
        quantity: 1,
        totalValues: 0,
        valueSalesExcludingST: 0,
        fixedNotifiedValueOrRetailPrice: 0,
        salesTaxApplicable: 0,
        salesTaxWithheldAtSource: 0,
        extraTax: "",
        furtherTax: 0,
        sroScheduleNo: "",
        fedPayable: 0,
        discount: 0,
        saleType: "",
        sroItemSerialNo: "",
      },
    ]);
  const removeItem = (idx) => setItems((arr) => arr.filter((_, i) => i !== idx));

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data?.data) setSellerProfile(data.data);
      } catch {}
    };
    loadProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Ensure all required fields are present
      const requiredFields = [
        'buyerNTNCNIC', 
        'buyerBusinessName',
        'invoiceNumber',
        'invoiceType',
        'sroScheduleNo'
      ];
      
      const missingFields = requiredFields.filter(field => {
        const value = form[field];
        return !value || (typeof value === 'string' && value.trim() === '');
      });
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setSaving(false);
        return;
      }

      // Ensure all items have required fields
      const missingItemFields = [];
      items.forEach((item, index) => {
        if (!item.productDescription) missingItemFields.push(`Item ${index + 1} Product Description`);
        if (!item.valueSalesExcludingST || item.valueSalesExcludingST <= 0) missingItemFields.push(`Item ${index + 1} Value Sales Excluding ST`);
      });

      if (missingItemFields.length > 0) {
        toast.error(`Please fill in all required item fields: ${missingItemFields.join(', ')}`);
        setSaving(false);
        return;
      }

      const payload = { 
        buyerNTNCNIC: form.buyerNTNCNIC && form.buyerNTNCNIC.trim() !== '' ? form.buyerNTNCNIC : null,
        buyerBusinessName: form.buyerBusinessName && form.buyerBusinessName.trim() !== '' ? form.buyerBusinessName : null,
        buyerProvince: form.buyerProvince && form.buyerProvince.trim() !== '' ? form.buyerProvince : null,
        buyerAddress: form.buyerAddress && form.buyerAddress.trim() !== '' ? form.buyerAddress : null,
        buyerRegistrationType: form.buyerRegistrationType && form.buyerRegistrationType.trim() !== '' ? form.buyerRegistrationType : null,
        invoiceRefNo: form.invoiceRefNo && form.invoiceRefNo.trim() !== '' ? form.invoiceRefNo : null,
        scenarioId: form.scenarioId && form.scenarioId.trim() !== '' ? form.scenarioId : null,
        // Add the missing fields
        invoiceNumber: form.invoiceNumber && form.invoiceNumber.trim() !== '' ? form.invoiceNumber : null,
        irn: form.irn && form.irn.trim() !== '' ? form.irn : null,
        invoiceType: form.invoiceType && form.invoiceType.trim() !== '' ? form.invoiceType : null,
        sroScheduleNo: form.sroScheduleNo && form.sroScheduleNo.trim() !== '' ? form.sroScheduleNo : null,
        salesTaxWithheldAtSource: form.salesTaxWithheldAtSource && form.salesTaxWithheldAtSource !== '' ? Number(form.salesTaxWithheldAtSource) : null,
        furtherTax: form.furtherTax && form.furtherTax !== '' ? Number(form.furtherTax) : null,
        fixedNotifiedValueOrRetailPrice: form.fixedNotifiedValueOrRetailPrice && form.fixedNotifiedValueOrRetailPrice !== '' ? Number(form.fixedNotifiedValueOrRetailPrice) : null,
        invoiceDate: form.invoiceDate && form.invoiceDate.trim() !== '' ? form.invoiceDate : null,
        dueDate: form.dueDate && form.dueDate.trim() !== '' ? form.dueDate : null,
        currency: form.currency || 'PKR',
        items,
        // Calculate totals properly
        subtotal: items.reduce((sum, item) => sum + (Number(item.valueSalesExcludingST) || 0), 0),
        taxAmount: items.reduce((sum, item) => sum + (Number(item.salesTaxApplicable || 0) * Number(item.valueSalesExcludingST || 0) / 100), 0),
        totalAmount: items.reduce((sum, item) => sum + (Number(item.totalValues) || 0), 0)
      };

      console.log('Creating invoice with payload:', payload);
      console.log('Form state:', form);
      console.log('Items state:', items);
      console.log('Individual field values:');
      console.log('- invoiceNumber:', form.invoiceNumber, 'Type:', typeof form.invoiceNumber, 'Length:', form.invoiceNumber ? form.invoiceNumber.length : 0);
      console.log('- invoiceType:', form.invoiceType, 'Type:', typeof form.invoiceType, 'Length:', form.invoiceType ? form.invoiceType.length : 0);
      console.log('- sroScheduleNo:', form.sroScheduleNo, 'Type:', typeof form.sroScheduleNo, 'Length:', form.sroScheduleNo ? form.sroScheduleNo.length : 0);
      console.log('- salesTaxWithheldAtSource:', form.salesTaxWithheldAtSource, 'Type:', typeof form.salesTaxWithheldAtSource);
      console.log('- furtherTax:', form.furtherTax, 'Type:', typeof form.furtherTax);
      console.log('- fixedNotifiedValueOrRetailPrice:', form.fixedNotifiedValueOrRetailPrice, 'Type:', typeof form.fixedNotifiedValueOrRetailPrice);
      console.log('- dueDate:', form.dueDate, 'Type:', typeof form.dueDate, 'Length:', form.dueDate ? form.dueDate.length : 0);
      
      const res = await invoiceApi.create(payload);
      toast.success("Invoice saved as draft");
      setTimeout(() => {
        router.push(`/user/invoices/${res.data.id}`);
      }, 800);
    } catch (e) {
      console.error('Error creating invoice:', e);
      toast.error("Error while creating invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Toaster position="top-center" />
      {/* Seller Profile (read-only) */}
      <Card className="mb-6 border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Seller Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sellerProfile ? (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Invoice Type</Label>
                <Input value={sellerProfile.invoiceType || ''} readOnly disabled />
              </div>
              <div>
                <Label>Default Invoice Date</Label>
                <Input value={sellerProfile.invoiceDate ? new Date(sellerProfile.invoiceDate).toISOString().slice(0,10) : ''} readOnly disabled />
              </div>
              <div>
                <Label>Seller NTN/CNIC</Label>
                <Input value={sellerProfile.sellerNTNCNIC || ''} readOnly disabled />
              </div>
              <div>
                <Label>Seller Business Name</Label>
                <Input value={sellerProfile.sellerBusinessName || ''} readOnly disabled />
              </div>
              <div>
                <Label>Seller Province</Label>
                <Input value={sellerProfile.sellerProvince || ''} readOnly disabled />
              </div>
              <div className="md:col-span-2">
                <Label>Seller Address</Label>
                <Input value={sellerProfile.sellerAddress || ''} readOnly disabled />
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600">No seller profile found. Set it in your profile page.</div>
          )}
        </CardContent>
      </Card>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Create Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Invoice Number *</Label>
                <Input value={form.invoiceNumber || ''} onChange={(e) => setField('invoiceNumber', e.target.value)} />
              </div>
              <div>
                <Label>IRN</Label>
                <Input value={form.irn || ''} onChange={(e) => setField('irn', e.target.value)}  />
              </div>
              <div>
                <Label>Invoice Type *</Label>
                <select 
                  value={form.invoiceType || ''} 
                  onChange={(e) => setField('invoiceType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Invoice Type</option>
                  <option value="Sale Invoice">Sale Invoice</option>
                  <option value="Purchase Invoice">Purchase Invoice</option>
                  <option value="Credit Note">Credit Note</option>
                  <option value="Debit Note">Debit Note</option>
                </select>
              </div>
              <div>
                <Label>Buyer NTN/CNIC</Label>
                <Input value={form.buyerNTNCNIC} onChange={(e) => setField('buyerNTNCNIC', e.target.value)} required />
              </div>
              <div>
                <Label>Buyer Business Name</Label>
                <Input value={form.buyerBusinessName} onChange={(e) => setField('buyerBusinessName', e.target.value)} required />
              </div>
              <div>
                <Label>Buyer Province</Label>
                <Input value={form.buyerProvince} onChange={(e) => setField('buyerProvince', e.target.value)} />
              </div>
              <div>
                <Label>Buyer Address</Label>
                <Input value={form.buyerAddress} onChange={(e) => setField('buyerAddress', e.target.value)} />
              </div>
              <div>
                <Label>Buyer Registration Type</Label>
                <Input value={form.buyerRegistrationType} onChange={(e) => setField('buyerRegistrationType', e.target.value)} />
              </div>
              <div>
                <Label>Invoice Ref No</Label>
                <Input value={form.invoiceRefNo} onChange={(e) => setField('invoiceRefNo', e.target.value)} />
              </div>
              <div>
                <Label>Scenario Id</Label>
                <Input value={form.scenarioId} onChange={(e) => setField('scenarioId', e.target.value)} />
              </div>
              <div>
                <Label>SRO/Schedule Number *</Label>
                <Input value={form.sroScheduleNo || ''} onChange={(e) => setField('sroScheduleNo', e.target.value)} />
              </div>
              <div>
                <Label>ST Withheld at Source *</Label>
                <Input type="number" step="0.01" value={form.salesTaxWithheldAtSource || ''} onChange={(e) => setField('salesTaxWithheldAtSource', e.target.value)} />
              </div>
              <div>
                <Label>Further Tax *</Label>
                <Input type="number" step="0.01" value={form.furtherTax || ''} onChange={(e) => setField('furtherTax', e.target.value)} />
              </div>
              <div>
                <Label>Fixed/Notified Value *</Label>
                <Input type="number" step="0.01" value={form.fixedNotifiedValueOrRetailPrice || ''} onChange={(e) => setField('fixedNotifiedValueOrRetailPrice', e.target.value)} />
              </div>
              <div>
                <Label>Invoice Date *</Label>
                <Input type="date" value={form.invoiceDate || new Date().toISOString().slice(0,10)} onChange={(e) => setField('invoiceDate', e.target.value)} required />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0,10)} onChange={(e) => setField('dueDate', e.target.value)} />
              </div>
              <div>
                <Label>Currency</Label>
                <select 
                  value={form.currency || 'PKR'} 
                  onChange={(e) => setField('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="PKR">PKR (Pakistani Rupee)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Items</h3>
                <Button type="button" onClick={addItem} className="bg-blue-600 hover:bg-blue-700 text-white">Add Item</Button>
              </div>
              {items.map((it, idx) => (
                <div key={idx} className="grid md:grid-cols-4 gap-3 items-end border p-3 rounded-md">
                  <div>
                    <Label>HS Code</Label>
                    <Input value={it.hsCode} onChange={(e) => updateItem(idx, 'hsCode', e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Product Description</Label>
                    <Input value={it.productDescription} onChange={(e) => updateItem(idx, 'productDescription', e.target.value)} />
                  </div>
                  <div>
                    <Label>Rate</Label>
                    <Input value={it.rate} onChange={(e) => updateItem(idx, 'rate', e.target.value)} placeholder="e.g. 18%" />
                  </div>
                  <div>
                    <Label>Unit of Measure (UoM)</Label>
                    <Input value={it.uom} onChange={(e) => updateItem(idx, 'uom', e.target.value)} />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input type="number" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                  </div>
                  <div>
                    <Label>Value Sales Excluding ST</Label>
                    <Input type="number" value={it.valueSalesExcludingST} onChange={(e) => updateItem(idx, 'valueSalesExcludingST', e.target.value)} />
                  </div>
                  <div>
                    <Label>Total Values</Label>
                    <Input type="number" value={it.totalValues} onChange={(e) => updateItem(idx, 'totalValues', e.target.value)} />
                  </div>
                  <div>
                    <Label>Fixed Notified Value / Retail Price</Label>
                    <Input type="number" value={it.fixedNotifiedValueOrRetailPrice} onChange={(e) => updateItem(idx, 'fixedNotifiedValueOrRetailPrice', e.target.value)} />
                  </div>
                  <div>
                    <Label>Sales Tax Applicable (%)</Label>
                    <Input type="number" value={it.salesTaxApplicable} onChange={(e) => updateItem(idx, 'salesTaxApplicable', e.target.value)} />
                  </div>
                  <div>
                    <Label>Sales Tax Withheld At Source</Label>
                    <Input type="number" value={it.salesTaxWithheldAtSource} onChange={(e) => updateItem(idx, 'salesTaxWithheldAtSource', e.target.value)} />
                  </div>
                  <div>
                    <Label>Extra Tax</Label>
                    <Input value={it.extraTax} onChange={(e) => updateItem(idx, 'extraTax', e.target.value)} />
                  </div>
                  <div>
                    <Label>Further Tax</Label>
                    <Input type="number" value={it.furtherTax} onChange={(e) => updateItem(idx, 'furtherTax', e.target.value)} />
                  </div>
                  <div>
                    <Label>SRO Schedule No</Label>
                    <Input value={it.sroScheduleNo} onChange={(e) => updateItem(idx, 'sroScheduleNo', e.target.value)} />
                  </div>
                  <div>
                    <Label>FED Payable</Label>
                    <Input type="number" value={it.fedPayable} onChange={(e) => updateItem(idx, 'fedPayable', e.target.value)} />
                  </div>
                  <div>
                    <Label>Discount</Label>
                    <Input type="number" value={it.discount} onChange={(e) => updateItem(idx, 'discount', e.target.value)} />
                  </div>
                  <div>
                    <Label>Sale Type</Label>
                    <Input value={it.saleType} onChange={(e) => updateItem(idx, 'saleType', e.target.value)} />
                  </div>
                  <div>
                    <Label>SRO Item Serial No</Label>
                    <Input value={it.sroItemSerialNo} onChange={(e) => updateItem(idx, 'sroItemSerialNo', e.target.value)} />
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <Button type="button" variant="outline" className="bg-red-600 hover:bg-red-700 text-white hover:text-white" onClick={() => removeItem(idx)}>Remove</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">{saving ? 'Saving...' : 'Save Draft'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



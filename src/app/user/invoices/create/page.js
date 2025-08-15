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
      uoM: "",
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
        uoM: "",
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
      const payload = { ...form, items };
      const v = await fbrApi.validate(payload);
      if (!v.success) {
        toast.error(`Validation errors: ${v.errors.join(', ')}`);
        setSaving(false);
        return;
      }
      const res = await invoiceApi.create(payload);
      toast.success("Invoice saved as draft");
      setTimeout(() => {
        router.push(`/user/invoices/${res.data.id}`);
      }, 800);
    } catch (e) {
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
                    <Input value={it.uoM} onChange={(e) => updateItem(idx, 'uoM', e.target.value)} />
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



"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Receipt, User as UserIcon, BadgeCheck } from "lucide-react";
import Link from "next/link";
import { invoiceApi } from "@/lib/api";

export default function UserDashboard() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await invoiceApi.list({ limit: 5 });
        setInvoices(res.data || []);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-8 text-white">
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome</h1>
            <p className="text-blue-100">Here are your most recent invoices.</p>
          </div>
          <Button asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Link href="/user/invoices/create">Create Invoice</Link>
          </Button>
        </div>
      </div>

      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="w-5 h-5 text-blue-600" /> Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (<div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead># Invoice Number</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Link href={`/user/invoices/${inv.id}`} className="text-blue-600 hover:underline">{inv.invoiceRefNo || '—'}</Link>
                    </TableCell>
                    <TableCell>{inv.buyerName}</TableCell>
                    <TableCell className="capitalize">{inv.status}</TableCell>
                    <TableCell className="text-right">₨{Number(inv.totalAmount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



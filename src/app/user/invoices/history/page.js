"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoiceApi } from "@/lib/api";
import Link from "next/link";

export default function InvoiceHistoryPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [data, setData] = useState({ rows: [], total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await invoiceApi.list({ page, limit: data.limit, search, status });
      setData({ rows: res.data || [], total: res.pagination?.total || 0, page, limit: res.pagination?.limit || 10 });
    } finally {
      setLoading(false);
    }
  }, [search, status, data.limit]);

  useEffect(() => { load(1); }, [load]);

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Invoice History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3 mb-4">
            <Input placeholder="Search by number, buyer, IRN" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="h-10 border rounded px-3" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="registered">Registered</option>
              <option value="failed">Failed</option>
            </select>
            <button className="h-10 bg-blue-600 text-white rounded" onClick={() => load(1)}>Search</button>
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : data.rows.length === 0 ? (
            <div className="text-sm text-gray-500">No invoices found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead># Invoice Number</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IRN</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell><Link href={`/user/invoices/${inv.id}`} className="text-blue-600 hover:underline">{inv.invoiceRefNo || '—'}</Link></TableCell>
                    <TableCell>{inv.buyerName}</TableCell>
                    <TableCell className="capitalize">{inv.status}</TableCell>
                    <TableCell>{inv.irn || '-'}</TableCell>
                    <TableCell className="text-right">₨{Number(inv.totalAmount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <div className="flex justify-between items-center mt-4 text-sm">
            <div>Total: {data.total}</div>
            <div className="flex gap-2">
              <button disabled={data.page <= 1} className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => load(data.page - 1)}>Prev</button>
              <button disabled={data.page * data.limit >= data.total} className="px-3 py-1 border rounded disabled:opacity-50" onClick={() => load(data.page + 1)}>Next</button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, CreditCard, Building2 } from "lucide-react";
import { subscriptionApi } from "@/lib/api";

export default function EditSubscriptionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [form, setForm] = useState({ plan: "", expiresAt: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await subscriptionApi.getSubscription(id);
        const data = res.data || res; // fallback
        setOrgName(data.organizationName || "Organization");
        setForm({
          plan: data.subscription?.plan || "",
          expiresAt: data.subscription?.expiresAt ? new Date(data.subscription.expiresAt).toISOString().slice(0,10) : "",
        });
      } finally { setLoading(false); }
    };
    if (id) load();
  }, [id]);

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { action: 'edit' };
      if (form.plan !== undefined) payload.subscriptionPlan = form.plan || null;
      if (form.expiresAt !== undefined) payload.subscriptionExpiresAt = form.expiresAt || null;
      await subscriptionApi.updateSubscription(id, payload);
      router.push('/admin/subscriptions');
    } catch (e) {
      alert('Failed to save');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <CreditCard className="w-5 h-5 text-teal-600" /> Edit Subscription
          </CardTitle>
          <div className="text-sm text-gray-600 flex items-center gap-2">
            <Building2 className="w-4 h-4" /> {orgName}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Plan</Label>
                <Input placeholder="standard" value={form.plan} onChange={(e) => setField('plan', e.target.value)} />
                <div className="text-xs text-gray-500 mt-1">Enter plan key, e.g., standard</div>
              </div>
              <div>
                <Label>Expiry Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input type="date" className="pl-9" value={form.expiresAt} onChange={(e) => setField('expiresAt', e.target.value)} />
                </div>
                <div className="text-xs text-gray-500 mt-1">Leave empty to clear</div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">{saving ? 'Saving...' : 'Save Changes'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}



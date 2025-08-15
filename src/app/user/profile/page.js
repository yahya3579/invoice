"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    invoiceType: "",
    invoiceDate: "",
    sellerNTNCNIC: "",
    sellerBusinessName: "",
    sellerProvince: "",
    sellerAddress: "",
  });
  const [userMeta, setUserMeta] = useState({ email: "", organizationName: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        const nextUser = data.user || null;
        setUser(nextUser);
        if (nextUser) {
          const p = await fetch('/api/profile');
          const pd = await p.json();
          if (pd?.data) {
            const d = pd.data;
            setProfile({
              invoiceType: d.invoiceType || "",
              invoiceDate: d.invoiceDate ? new Date(d.invoiceDate).toISOString().slice(0, 10) : "",
              sellerNTNCNIC: d.sellerNTNCNIC || "",
              sellerBusinessName: d.sellerBusinessName || "",
              sellerProvince: d.sellerProvince || "",
              sellerAddress: d.sellerAddress || "",
            });
          }
          // Load user's email (from session) and organization name
          const detailsRes = await fetch(`/api/users/${nextUser.id}`);
          const details = await detailsRes.json();
          const orgName = details?.data?.organization?.name || "";
          setUserMeta({ email: nextUser.email || "", organizationName: orgName });
        }
      } catch {}
    };
    load();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const out = await res.json();
      if (!res.ok || !out?.success) throw new Error(out?.error || 'Failed to save');
      toast.success('Profile updated successfully');
      setTimeout(() => {
        router.push('/user/invoices/create');
      }, 600);
    } catch {}
    setSaving(false);
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl border-0 shadow-xl bg-gradient-to-br from-white to-blue-50">
        <CardHeader>
          <CardTitle className="text-gray-900">Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          <div>
            <Label>Invoice Type</Label>
            <Input name="invoiceType" value={profile.invoiceType} onChange={handleChange}/>
          </div>
          <div>
            <Label>Invoice Date</Label>
            <Input type="date" name="invoiceDate" value={profile.invoiceDate} onChange={handleChange} />
          </div>
          <div>
            <Label>Seller NTN/CNIC</Label>
            <Input name="sellerNTNCNIC" value={profile.sellerNTNCNIC} onChange={handleChange} />
          </div>
          <div>
            <Label>Seller Business Name</Label>
            <Input name="sellerBusinessName" value={profile.sellerBusinessName} onChange={handleChange}  />
          </div>
          <div>
            <Label>Seller Province</Label>
            <Input name="sellerProvince" value={profile.sellerProvince} onChange={handleChange} />
          </div>
          <div>
            <Label>Seller Address</Label>
            <Input name="sellerAddress" value={profile.sellerAddress} onChange={handleChange} />
          </div>
          <div className="pt-2">
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </CardContent>
        {/* Read-only user meta section */}
        <CardContent className="space-y-4 p-6 pt-0">
          <div className="pt-2 border-t">
            <CardTitle className="text-gray-900 text-base mb-2">Account Info</CardTitle>
            <div className="grid gap-4">
              <div>
                <Label>Email</Label>
                <Input value={userMeta.email} readOnly disabled />
              </div>
              <div>
                <Label>Organization</Label>
                <Input value={userMeta.organizationName} readOnly disabled />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

function parseDateOrNull(value) {
  if (!value) return null;
  try {
    // Accept YYYY-MM-DD or ISO; construct Date to store as DateTime
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const { user } = auth;
  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId: user.id } });
    return NextResponse.json({
      success: true,
      data: profile || null,
    });
  } catch (e) {
    console.error("GET /api/profile error", e);
    return NextResponse.json({ success: false, error: e?.message || "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(req) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const { user } = auth;
  try {
    const body = await req.json();
    const {
      invoiceType,
      invoiceDate,
      sellerNTNCNIC,
      sellerBusinessName,
      sellerProvince,
      sellerAddress,
    } = body || {};

    const data = {
      invoiceType: invoiceType ?? null,
      invoiceDate: parseDateOrNull(invoiceDate),
      sellerNTNCNIC: sellerNTNCNIC ?? null,
      sellerBusinessName: sellerBusinessName ?? null,
      sellerProvince: sellerProvince ?? null,
      sellerAddress: sellerAddress ?? null,
      user: { connect: { id: user.id } },
    };

    // Upsert ensures create if missing, otherwise update
    const saved = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {
        invoiceType: data.invoiceType,
        invoiceDate: data.invoiceDate,
        sellerNTNCNIC: data.sellerNTNCNIC,
        sellerBusinessName: data.sellerBusinessName,
        sellerProvince: data.sellerProvince,
        sellerAddress: data.sellerAddress,
      },
      create: data,
    });

    return NextResponse.json({ success: true, data: saved });
  } catch (e) {
    console.error("PUT /api/profile error", e);
    return NextResponse.json({ success: false, error: e?.message || "Failed to save profile" }, { status: 500 });
  }
}



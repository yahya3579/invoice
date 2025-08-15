import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest, requireAuth } from "@/lib/auth";

// GET /api/invoices - Get user invoices with pagination/search
export async function GET(req) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const user = auth.user;
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");
    const sort = searchParams.get("sort") || "createdAt:desc";
    let [sortField, sortDir] = sort.split(":");
    const allowedSortFields = new Set(["createdAt", "invoiceDate", "totalAmount", "invoiceNumber"]);
    if (!allowedSortFields.has(sortField)) sortField = "createdAt";
    sortDir = sortDir === "asc" ? "asc" : "desc";
    const skip = (page - 1) * limit;

    const where = {
      userId: user.id,
      ...(search
        ? {
            OR: [
              { invoiceNumber: { contains: search } },
              { buyerName: { contains: search } },
              { irn: { contains: search } },
            ],
          }
        : {}),
      ...(status ? { status } : {}),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortField]: sortDir },
        include: { _count: { select: { items: true } } },
      }),
      prisma.invoice.count({ where }),
    ]);

    // Normalize Decimal values to numbers to prevent JSON serialization issues
    const normalized = invoices.map((inv) => ({
      id: inv.id,
      userId: inv.userId,
      organizationId: inv.organizationId,
      invoiceNumber: inv.invoiceNumber,
      invoiceRefNo: inv.invoiceRefNo,
      irn: inv.irn,
      buyerName: inv.buyerName,
      buyerNtn: inv.buyerNtn,
      buyerAddress: inv.buyerAddress,
      invoiceDate: inv.invoiceDate,
      dueDate: inv.dueDate,
      subtotal: inv.subtotal != null ? parseFloat(inv.subtotal) : 0,
      taxAmount: inv.taxAmount != null ? parseFloat(inv.taxAmount) : 0,
      totalAmount: inv.totalAmount != null ? parseFloat(inv.totalAmount) : 0,
      currency: inv.currency,
      status: inv.status,
      fbrResponse: inv.fbrResponse,
      pdfPath: inv.pdfPath,
      qrCode: inv.qrCode,
      createdAt: inv.createdAt,
      updatedAt: inv.updatedAt,
      _count: inv._count,
    }));

    return NextResponse.json({
      success: true,
      data: normalized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("Error fetching invoices:", e);
    return NextResponse.json({ success: false, error: "Failed to fetch invoices" }, { status: 500 });
  }
}

// POST /api/invoices - Create single invoice
export async function POST(req) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const user = auth.user;
  try {
    const body = await req.json();
    const {
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      invoiceRefNo,
      scenarioId,
      items = [],
    } = body;

    if (!buyerBusinessName || !buyerNTNCNIC || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let totalAmount = 0;
    const normalizedItems = items.map((item) => {
      const quantity = Number(item.quantity || 1);
      const valueSalesExcludingST = Number(item.valueSalesExcludingST || 0);
      const taxRate = Number(item.salesTaxApplicable || 0);
      const itemSubtotal = valueSalesExcludingST;
      const itemTax = (itemSubtotal * taxRate) / 100;
      const itemTotal = itemSubtotal + itemTax;
      subtotal += itemSubtotal;
      taxAmount += itemTax;
      totalAmount += itemTotal;
      return {
        itemDescription: item.productDescription || item.itemDescription || "Item",
        hsCode: item.hsCode || null,
        productDescription: item.productDescription || null,
        rate: item.rate || null,
        uom: item.uoM || null,
        quantity,
        unitPrice: valueSalesExcludingST,
        valueSalesExcludingST: itemSubtotal,
        totalValues: Number(item.totalValues || itemSubtotal + itemTax) || null,
        fixedNotifiedValueOrRetailPrice: Number(item.fixedNotifiedValueOrRetailPrice || 0) || null,
        salesTaxApplicable: taxRate,
        salesTaxWithheldAtSource: Number(item.salesTaxWithheldAtSource || 0) || null,
        extraTax: item.extraTax || null,
        furtherTax: Number(item.furtherTax || 0) || null,
        sroScheduleNo: item.sroScheduleNo || null,
        fedPayable: Number(item.fedPayable || 0) || null,
        discount: Number(item.discount || 0) || null,
        saleType: item.saleType || null,
        sroItemSerialNo: item.sroItemSerialNo || null,
        taxRate,
        taxAmount: itemTax,
        totalAmount: itemTotal,
      };
    });

    const organizationId = user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: "User is not linked to an organization" }, { status: 400 });
    }

    const created = await prisma.invoice.create({
      data: {
        userId: user.id,
        organizationId,
        invoiceNumber: null,
        buyerName: buyerBusinessName,
        buyerNtn: buyerNTNCNIC || null,
        buyerAddress: buyerAddress || null,
        invoiceDate: new Date(),
        dueDate: null,
        currency: "PKR",
        buyerNtnCnic: buyerNTNCNIC || null,
        buyerBusinessName: buyerBusinessName || null,
        buyerProvince: buyerProvince || null,
        buyerRegistrationType: buyerRegistrationType || null,
        invoiceRefNo: invoiceRefNo || null,
        scenarioId: scenarioId || null,
        subtotal,
        taxAmount,
        totalAmount,
        status: "draft",
        items: {
          create: normalizedItems,
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: "Failed to create invoice" }, { status: 500 });
  }
}



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
  console.log('POST /api/invoices called');
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const user = auth.user;
  console.log('User authenticated:', user.id, 'Organization:', user.organizationId);
  try {
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    console.log('Extracted fields:');
    console.log('- invoiceNumber:', body.invoiceNumber);
    console.log('- invoiceType:', body.invoiceType);
    console.log('- sroScheduleNo:', body.sroScheduleNo);
    console.log('- salesTaxWithheldAtSource:', body.salesTaxWithheldAtSource);
    console.log('- furtherTax:', body.furtherTax);
    console.log('- fixedNotifiedValueOrRetailPrice:', body.fixedNotifiedValueOrRetailPrice);
    console.log('- dueDate:', body.dueDate);
    
    const {
      buyerNTNCNIC,
      buyerBusinessName,
      buyerProvince,
      buyerAddress,
      buyerRegistrationType,
      invoiceRefNo,
      scenarioId,
      invoiceNumber,
      irn,
      invoiceType,
      sroScheduleNo,
      salesTaxWithheldAtSource,
      furtherTax,
      fixedNotifiedValueOrRetailPrice,
      currency,
      invoiceDate,
      dueDate,
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
        uom: item.uom || null,
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

    console.log('About to create invoice with data:', {
      userId: user.id,
      organizationId,
      invoiceNumber,
      invoiceType,
      sroScheduleNo,
      salesTaxWithheldAtSource,
      furtherTax,
      fixedNotifiedValueOrRetailPrice,
      dueDate,
      subtotal,
      taxAmount,
      totalAmount,
      itemCount: normalizedItems.length
    });

    const created = await prisma.invoice.create({
      data: {
        userId: user.id,
        organizationId,
        invoiceNumber: invoiceNumber && invoiceNumber.trim() !== '' ? invoiceNumber : null,
        irn: irn && irn.trim() !== '' ? irn : null,
        buyerName: buyerBusinessName,
        buyerNtn: buyerNTNCNIC && buyerNTNCNIC.trim() !== '' ? buyerNTNCNIC : null,
        buyerAddress: buyerAddress && buyerAddress.trim() !== '' ? buyerAddress : null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate && dueDate.trim() !== '' ? new Date(dueDate) : null,
        currency: currency || "PKR",
        buyerNtnCnic: buyerNTNCNIC && buyerNTNCNIC.trim() !== '' ? buyerNTNCNIC : null,
        buyerBusinessName: buyerBusinessName || null,
        buyerProvince: buyerProvince && buyerProvince.trim() !== '' ? buyerProvince : null,
        buyerRegistrationType: buyerRegistrationType && buyerRegistrationType.trim() !== '' ? buyerRegistrationType : null,
        invoiceRefNo: invoiceRefNo && invoiceRefNo.trim() !== '' ? invoiceRefNo : null,
        scenarioId: scenarioId && scenarioId.trim() !== '' ? scenarioId : null,
        // FBR-specific fields - ensure proper mapping
        invoiceType: invoiceType && invoiceType.trim() !== '' ? invoiceType : null,
        sroScheduleNo: sroScheduleNo && sroScheduleNo.trim() !== '' ? sroScheduleNo : null,
        salesTaxWithheldAtSource: salesTaxWithheldAtSource && salesTaxWithheldAtSource !== '' ? parseFloat(salesTaxWithheldAtSource) : null,
        furtherTax: furtherTax && furtherTax !== '' ? parseFloat(furtherTax) : null,
        fixedNotifiedValueOrRetailPrice: fixedNotifiedValueOrRetailPrice && fixedNotifiedValueOrRetailPrice !== '' ? parseFloat(fixedNotifiedValueOrRetailPrice) : null,
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
    console.error('Error creating invoice:', e);
    return NextResponse.json({ 
      success: false, 
      error: "Failed to create invoice", 
      details: e.message || 'Unknown error'
    }, { status: 500 });
  }
}



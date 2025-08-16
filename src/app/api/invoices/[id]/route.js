import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getTokenFromRequest } from "@/lib/auth";

async function requireOwnerOrAdmin(req, invoiceId) {
  const user = getTokenFromRequest(req);
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  const invoice = await prisma.invoice.findUnique({ where: { id: Number(invoiceId) } });
  if (!invoice) return { error: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (user.role !== "admin" && invoice.userId !== user.id) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { user, invoice };
}

// GET /api/invoices/[id]
export async function GET(req, { params }) {
  const { id } = await params;
  const user = getTokenFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const invoice = await prisma.invoice.findUnique({
    where: { id: Number(id) },
    include: { 
      items: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          fbrApiToken: true,
          profile: {
            select: {
              invoiceType: true,
              invoiceDate: true,
              sellerNTNCNIC: true,
              sellerBusinessName: true,
              sellerProvince: true,
              sellerAddress: true
            }
          }
        }
      },
      organization: {
        select: {
          id: true,
          name: true,
          ntn: true,
          address: true,
          businessType: true,
          phone: true,
          email: true
        }
      }
    },
  });
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role !== "admin" && invoice.userId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  // Normalize Decimal values
  const norm = {
    ...invoice,
    subtotal: invoice.subtotal != null ? parseFloat(invoice.subtotal) : 0,
    taxAmount: invoice.taxAmount != null ? parseFloat(invoice.taxAmount) : 0,
    totalAmount: invoice.totalAmount != null ? parseFloat(invoice.totalAmount) : 0,
    // Ensure FBR fields are included
    invoiceNumber: invoice.invoiceNumber,
    invoiceType: invoice.invoiceType,
    sroScheduleNo: invoice.sroScheduleNo,
    salesTaxWithheldAtSource: invoice.salesTaxWithheldAtSource != null ? parseFloat(invoice.salesTaxWithheldAtSource) : null,
    furtherTax: invoice.furtherTax != null ? parseFloat(invoice.furtherTax) : null,
    fixedNotifiedValueOrRetailPrice: invoice.fixedNotifiedValueOrRetailPrice != null ? parseFloat(invoice.fixedNotifiedValueOrRetailPrice) : null,
    items: invoice.items.map((it) => ({
      ...it,
      quantity: it.quantity != null ? parseFloat(it.quantity) : 0,
      unitPrice: it.unitPrice != null ? parseFloat(it.unitPrice) : 0,
      taxRate: it.taxRate != null ? parseFloat(it.taxRate) : 0,
      taxAmount: it.taxAmount != null ? parseFloat(it.taxAmount) : 0,
      totalAmount: it.totalAmount != null ? parseFloat(it.totalAmount) : 0,
      // Ensure item FBR fields are included
      rate: it.rate,
      uom: it.uom,
      sroItemSerialNo: it.sroItemSerialNo,
    })),
  };
  return NextResponse.json({ success: true, data: norm });
}

// PUT /api/invoices/[id]
export async function PUT(req, { params }) {
  const { id } = await params;
  const auth = await requireOwnerOrAdmin(req, id);
  if (auth.error) return auth.error;
  try {
    const body = await req.json();
    const {
      buyerName,
      buyerNtn,
      buyerAddress,
      invoiceDate,
      dueDate,
      currency,
      items,
      status,
    } = body;

    let subtotal, taxAmount, totalAmount;
    let itemsUpdate;
    if (Array.isArray(items)) {
      subtotal = 0;
      taxAmount = 0;
      totalAmount = 0;
      itemsUpdate = {
        deleteMany: {},
        create: items.map((item) => {
          const quantity = Number(item.quantity || 1);
          const unitPrice = Number(item.unitPrice || 0);
          const taxRate = Number(item.taxRate || 0);
          const itemSubtotal = quantity * unitPrice;
          const itemTax = (itemSubtotal * taxRate) / 100;
          const itemTotal = itemSubtotal + itemTax;
          subtotal += itemSubtotal;
          taxAmount += itemTax;
          totalAmount += itemTotal;
          return {
            itemDescription: item.itemDescription || "Item",
            hsCode: item.hsCode || null,
            quantity,
            unitPrice,
            taxRate,
            taxAmount: itemTax,
            totalAmount: itemTotal,
          };
        }),
      };
    }

    const updated = await prisma.invoice.update({
      where: { id: Number(id) },
      data: {
        ...(buyerName && { buyerName }),
        ...(buyerNtn !== undefined && { buyerNtn }),
        ...(buyerAddress !== undefined && { buyerAddress }),
        ...(invoiceDate && { invoiceDate: new Date(invoiceDate) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(currency && { currency }),
        ...(status && { status }),
        ...(itemsUpdate && { items: itemsUpdate }),
        ...(subtotal !== undefined && { subtotal, taxAmount, totalAmount }),
      },
      include: { items: true },
    });
  const norm = {
    ...updated,
    subtotal: updated.subtotal != null ? parseFloat(updated.subtotal) : 0,
    taxAmount: updated.taxAmount != null ? parseFloat(updated.taxAmount) : 0,
    totalAmount: updated.totalAmount != null ? parseFloat(updated.totalAmount) : 0,
    items: updated.items.map((it) => ({
      ...it,
      quantity: it.quantity != null ? parseFloat(it.quantity) : 0,
      unitPrice: it.unitPrice != null ? parseFloat(it.unitPrice) : 0,
      taxRate: it.taxRate != null ? parseFloat(it.taxRate) : 0,
      taxAmount: it.taxAmount != null ? parseFloat(it.taxAmount) : 0,
      totalAmount: it.totalAmount != null ? parseFloat(it.totalAmount) : 0,
    })),
  };
  return NextResponse.json({ success: true, data: norm });
  } catch (e) {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

// DELETE /api/invoices/[id]
export async function DELETE(req, { params }) {
  const { id } = await params;
  const auth = await requireOwnerOrAdmin(req, id);
  if (auth.error) return auth.error;
  try {
    await prisma.invoice.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}



import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// POST /api/invoices/bulk - Bulk create from parsed rows
export async function POST(req) {
  const auth = requireAuth(req);
  if (auth.error) return auth.error;
  const user = auth.user;
  try {
    const body = await req.json();
    const { invoices = [] } = body;
    if (!Array.isArray(invoices) || invoices.length === 0) {
      return NextResponse.json({ error: "No invoices provided" }, { status: 400 });
    }
    if (!user.organizationId) {
      return NextResponse.json({ error: "User is not linked to an organization" }, { status: 400 });
    }

    const created = [];
    for (const inv of invoices) {
      const items = inv.items || [];
      let subtotal = 0, taxAmount = 0, totalAmount = 0;
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

      const createdInv = await prisma.invoice.create({
        data: {
          userId: user.id,
          organizationId: user.organizationId,
          invoiceNumber: null,
          buyerName: inv.buyerBusinessName,
          buyerNtn: inv.buyerNTNCNIC || null,
          buyerAddress: inv.buyerAddress || null,
          invoiceDate: new Date(),
          dueDate: null,
          currency: "PKR",
          buyerNtnCnic: inv.buyerNTNCNIC || null,
          buyerBusinessName: inv.buyerBusinessName || null,
          buyerProvince: inv.buyerProvince || null,
          buyerRegistrationType: inv.buyerRegistrationType || null,
          invoiceRefNo: inv.invoiceRefNo || null,
          scenarioId: inv.scenarioId || null,
          subtotal,
          taxAmount,
          totalAmount,
          status: "draft",
          items: { create: normalizedItems },
        },
      });
      created.push(createdInv);
    }

    return NextResponse.json({ success: true, count: created.length });
  } catch (e) {
    return NextResponse.json({ error: "Bulk create failed" }, { status: 500 });
  }
}



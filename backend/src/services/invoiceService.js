const { nanoid } = require("nanoid");
const Invoice = require("../models/Invoice");
const InvoiceItem = require("../models/InvoiceItem");
const StockTransaction = require("../models/StockTransaction");

const calculateTotals = (items, invoiceDiscountPercent = 0) => {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  items.forEach((item) => {
    subtotal += item.unitPrice * item.quantity;
    tax += (item.unitPrice * item.quantity * item.taxRate) / 100;
    discount += item.discount || 0;
  });
  const percent = Math.max(0, Math.min(100, Number(invoiceDiscountPercent || 0)));
  const invoiceDiscountAmount = (subtotal * percent) / 100;
  const totalDiscount = discount + invoiceDiscountAmount;
  const total = subtotal + tax - totalDiscount;
  return { subtotal, tax, discount: totalDiscount, total };
};

const createInvoice = async ({ store, industry, issuedBy, items, ...rest }) => {
  const invoiceNumber = `INV-${nanoid(8).toUpperCase()}`;
  const totals = calculateTotals(items, rest.discountValue);
  const invoice = await Invoice.create({
    invoiceNumber,
    store,
    industry,
    issuedBy,
    totals,
    ...rest,
  });

  const invoiceItems = items.map((item) => ({
    ...item,
    invoice: invoice._id,
    lineTotal:
      item.unitPrice * item.quantity +
      (item.unitPrice * item.quantity * item.taxRate) / 100 -
      (item.discount || 0),
  }));
  await InvoiceItem.insertMany(invoiceItems);

  // Inventory integration (transaction-based, audit-friendly):
  // Create SOLD transactions only when invoice is ISSUED.
  if (String(rest.status || "").toUpperCase() === "ISSUED") {
    const occurredAt = rest.issuedAt ? new Date(rest.issuedAt) : new Date();
    const buyerName = rest.customerName || "";
    const soldRows = invoiceItems
      .filter((it) => it.item && it.quantity)
      .map((it) => ({
        type: "SOLD",
        store,
        item: it.item,
        quantity: Number(it.quantity),
        unitPrice: Number(it.unitPrice || 0),
        invoice: invoice._id,
        buyerName,
        occurredAt,
        createdBy: issuedBy,
      }));

    if (soldRows.length) {
      try {
        await StockTransaction.insertMany(soldRows, { ordered: false });
      } catch (e) {
        // Ignore duplicate key errors (idempotency via unique index store+invoice+item+type).
        if (e?.code !== 11000) throw e;
      }
    }
  }

  return invoice;
};

module.exports = { calculateTotals, createInvoice };

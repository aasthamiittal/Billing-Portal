const { nanoid } = require("nanoid");
const Invoice = require("../models/Invoice");
const InvoiceItem = require("../models/InvoiceItem");

const calculateTotals = (items) => {
  let subtotal = 0;
  let tax = 0;
  let discount = 0;
  items.forEach((item) => {
    subtotal += item.unitPrice * item.quantity;
    tax += (item.unitPrice * item.quantity * item.taxRate) / 100;
    discount += item.discount || 0;
  });
  const total = subtotal + tax - discount;
  return { subtotal, tax, discount, total };
};

const createInvoice = async ({ store, industry, issuedBy, items, ...rest }) => {
  const invoiceNumber = `INV-${nanoid(8).toUpperCase()}`;
  const totals = calculateTotals(items);
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

  return invoice;
};

module.exports = { calculateTotals, createInvoice };

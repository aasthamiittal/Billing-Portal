const Invoice = require("../models/Invoice");
const InvoiceItem = require("../models/InvoiceItem");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { createInvoice } = require("../services/invoiceService");
const {
  buildInvoicePdf,
  buildInvoiceExcel,
} = require("../services/reportService");

const listInvoices = asyncHandler(async (req, res) => {
  const filter = {};
  if (!req.user.isMasterAdmin) {
    filter.store = req.user.store;
  }
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).exec();
  res.json(invoices);
});

const createInvoiceHandler = asyncHandler(async (req, res) => {
  const invoice = await createInvoice({
    ...req.body,
    issuedBy: req.user._id,
  });
  res.status(201).json(invoice);
});

const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).exec();
  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }
  const items = await InvoiceItem.find({ invoice: invoice._id }).exec();
  const buffer = await buildInvoicePdf(invoice, items);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${invoice.invoiceNumber}.pdf`
  );
  res.send(buffer);
});

const downloadInvoiceExcel = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).exec();
  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }
  const items = await InvoiceItem.find({ invoice: invoice._id }).exec();
  const buffer = await buildInvoiceExcel(invoice, items);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${invoice.invoiceNumber}.xlsx`
  );
  res.send(buffer);
});

module.exports = {
  listInvoices,
  createInvoiceHandler,
  downloadInvoicePdf,
  downloadInvoiceExcel,
};

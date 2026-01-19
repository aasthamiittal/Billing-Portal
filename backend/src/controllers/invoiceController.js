const Invoice = require("../models/Invoice");
const InvoiceItem = require("../models/InvoiceItem");
const Store = require("../models/Store");
const CatalogEntry = require("../models/CatalogEntry");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { createInvoice } = require("../services/invoiceService");
const { audit } = require("../services/auditService");
const { getAccessibleStoreIds } = require("../utils/storeScope");
const {
  buildInvoicePdf,
  buildInvoiceExcel,
} = require("../services/reportService");

const listInvoices = asyncHandler(async (req, res) => {
  const filter = {};
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    filter.store = { $in: ids || [] };
  }
  const invoices = await Invoice.find(filter).sort({ createdAt: -1 }).exec();
  res.json(invoices);
});

const createInvoiceHandler = asyncHandler(async (req, res) => {
  const { storeId, items, orderTypeId, paymentTypeId, discountId, discountValue, ...rest } = req.body;

  const store = await Store.findById(storeId).populate("industry").exec();
  if (!store) {
    throw new ApiError(400, "Invalid store");
  }
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    if (!ids?.includes(String(store._id))) {
      throw new ApiError(403, "Access denied");
    }
  }

  const lookups = async (id, kind) => {
    if (!id) return null;
    const entry = await CatalogEntry.findById(id).exec();
    if (!entry || entry.kind !== kind) throw new ApiError(400, `Invalid ${kind}`);
    if (String(entry.store) !== String(store._id)) throw new ApiError(400, `${kind} does not belong to store`);
    return entry;
  };

  const orderType = await lookups(orderTypeId, "order-types");
  const paymentType = await lookups(paymentTypeId, "payment-types");
  const discount = await lookups(discountId, "discounts");

  const invoice = await createInvoice({
    store: store._id,
    industry: store.industry?._id,
    items,
    orderTypeId: orderType?._id,
    orderTypeName: orderType?.name || "",
    paymentTypeId: paymentType?._id,
    paymentTypeName: paymentType?.name || "",
    discountId: discount?._id,
    discountName: discount?.name || "",
    discountValue: typeof discountValue === "number" ? discountValue : Number(discount?.value || 0),
    ...rest,
    status: "ISSUED",
    issuedBy: req.user._id,
    issuedAt: new Date(),
  });
  await audit({
    actorId: req.user._id,
    action: "invoice.issue",
    entityType: "Invoice",
    entityId: invoice._id,
    metadata: { store: store._id },
  });
  res.status(201).json(invoice);
});

const createInvoiceDraftHandler = asyncHandler(async (req, res) => {
  const { storeId, items, orderTypeId, paymentTypeId, discountId, discountValue, ...rest } = req.body;

  const store = await Store.findById(storeId).populate("industry").exec();
  if (!store) {
    throw new ApiError(400, "Invalid store");
  }
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    if (!ids?.includes(String(store._id))) {
      throw new ApiError(403, "Access denied");
    }
  }

  const lookups = async (id, kind) => {
    if (!id) return null;
    const entry = await CatalogEntry.findById(id).exec();
    if (!entry || entry.kind !== kind) throw new ApiError(400, `Invalid ${kind}`);
    if (String(entry.store) !== String(store._id)) throw new ApiError(400, `${kind} does not belong to store`);
    return entry;
  };

  const orderType = await lookups(orderTypeId, "order-types");
  const paymentType = await lookups(paymentTypeId, "payment-types");
  const discount = await lookups(discountId, "discounts");

  const invoice = await createInvoice({
    store: store._id,
    industry: store.industry?._id,
    items,
    orderTypeId: orderType?._id,
    orderTypeName: orderType?.name || "",
    paymentTypeId: paymentType?._id,
    paymentTypeName: paymentType?.name || "",
    discountId: discount?._id,
    discountName: discount?.name || "",
    discountValue: typeof discountValue === "number" ? discountValue : Number(discount?.value || 0),
    ...rest,
    status: "DRAFT",
    issuedBy: req.user._id,
    issuedAt: new Date(),
  });
  await audit({
    actorId: req.user._id,
    action: "invoice.draft_create",
    entityType: "Invoice",
    entityId: invoice._id,
    metadata: { store: store._id },
  });
  res.status(201).json(invoice);
});

const downloadInvoicePdf = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id).populate("store").exec();
  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }
  if (!req.user.isMasterAdmin && String(invoice.store) !== String(req.user.store)) {
    throw new ApiError(403, "Access denied");
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
  const invoice = await Invoice.findById(req.params.id).populate("store").exec();
  if (!invoice) {
    throw new ApiError(404, "Invoice not found");
  }
  if (!req.user.isMasterAdmin && String(invoice.store) !== String(req.user.store)) {
    throw new ApiError(403, "Access denied");
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
  createInvoiceDraftHandler,
  downloadInvoicePdf,
  downloadInvoiceExcel,
};

const dayjs = require("dayjs");
const Invoice = require("../models/Invoice");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");
const {
  buildSalesReportExcel,
  buildSalesReportPdf,
  buildTaxReportExcel,
  buildTaxReportPdf,
  buildInvoiceReportExcel,
  buildInvoiceReportPdf,
} = require("../services/reportService");

const getSalesData = async (req) => {
  const { startDate, endDate, storeId } = req.query;
  const filter = {};
  if (startDate || endDate) {
    filter.issuedAt = {};
    if (startDate) filter.issuedAt.$gte = dayjs(startDate).toDate();
    if (endDate) filter.issuedAt.$lte = dayjs(endDate).toDate();
  }
  if (!req.user.isMasterAdmin) {
    const { getAccessibleStoreIds } = require("../utils/storeScope");
    const ids = await getAccessibleStoreIds(req.user);
    filter.store = { $in: ids || [] };
  } else if (storeId) {
    filter.store = storeId;
  }

  const invoices = await Invoice.find(filter).exec();
  const storeIds = [...new Set(invoices.map((inv) => inv.store?.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } }).exec();
  const storeMap = new Map(
    stores.map((store) => [store._id.toString(), store.name])
  );

  const rows = invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    store: storeMap.get(invoice.store?.toString()) || "-",
    total: invoice.totals?.total || 0,
    issuedAt: dayjs(invoice.issuedAt).format("YYYY-MM-DD"),
  }));
  const total = rows.reduce((sum, row) => sum + row.total, 0);
  return { rows, totals: { total } };
};

const downloadSalesReportExcel = asyncHandler(async (req, res) => {
  const { rows, totals } = await getSalesData(req);
  const buffer = await buildSalesReportExcel(rows, totals);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales-report.xlsx"
  );
  res.send(buffer);
});

const downloadSalesReportPdf = asyncHandler(async (req, res) => {
  const { rows, totals } = await getSalesData(req);
  const buffer = await buildSalesReportPdf(rows, totals);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=sales-report.pdf"
  );
  res.send(buffer);
});

const getTaxData = async (req) => {
  const { startDate, endDate, storeId } = req.query;
  const filter = {};
  if (startDate || endDate) {
    filter.issuedAt = {};
    if (startDate) filter.issuedAt.$gte = dayjs(startDate).toDate();
    if (endDate) filter.issuedAt.$lte = dayjs(endDate).toDate();
  }
  if (!req.user.isMasterAdmin) {
    const { getAccessibleStoreIds } = require("../utils/storeScope");
    const ids = await getAccessibleStoreIds(req.user);
    filter.store = { $in: ids || [] };
  } else if (storeId) {
    filter.store = storeId;
  }

  const invoices = await Invoice.find(filter).exec();
  const storeIds = [...new Set(invoices.map((inv) => inv.store?.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } }).exec();
  const storeMap = new Map(stores.map((store) => [store._id.toString(), store.name]));

  const rows = invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    store: storeMap.get(invoice.store?.toString()) || "-",
    tax: invoice.totals?.tax || 0,
    issuedAt: dayjs(invoice.issuedAt).format("YYYY-MM-DD"),
  }));

  const tax = rows.reduce((sum, row) => sum + row.tax, 0);
  return { rows, totals: { tax } };
};

const downloadTaxReportExcel = asyncHandler(async (req, res) => {
  const { rows, totals } = await getTaxData(req);
  const buffer = await buildTaxReportExcel(rows, totals);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=tax-report.xlsx");
  res.send(buffer);
});

const downloadTaxReportPdf = asyncHandler(async (req, res) => {
  const { rows, totals } = await getTaxData(req);
  const buffer = await buildTaxReportPdf(rows, totals);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=tax-report.pdf");
  res.send(buffer);
});

const getInvoiceReportData = async (req) => {
  const { startDate, endDate, storeId } = req.query;
  const filter = {};
  if (startDate || endDate) {
    filter.issuedAt = {};
    if (startDate) filter.issuedAt.$gte = dayjs(startDate).toDate();
    if (endDate) filter.issuedAt.$lte = dayjs(endDate).toDate();
  }
  if (!req.user.isMasterAdmin) {
    const { getAccessibleStoreIds } = require("../utils/storeScope");
    const ids = await getAccessibleStoreIds(req.user);
    filter.store = { $in: ids || [] };
  } else if (storeId) {
    filter.store = storeId;
  }

  const invoices = await Invoice.find(filter).exec();
  const storeIds = [...new Set(invoices.map((inv) => inv.store?.toString()))];
  const stores = await Store.find({ _id: { $in: storeIds } }).exec();
  const storeMap = new Map(stores.map((store) => [store._id.toString(), store.name]));

  const rows = invoices.map((invoice) => ({
    invoiceNumber: invoice.invoiceNumber,
    store: storeMap.get(invoice.store?.toString()) || "-",
    status: invoice.status,
    total: invoice.totals?.total || 0,
    tax: invoice.totals?.tax || 0,
    discount: invoice.totals?.discount || 0,
    issuedAt: dayjs(invoice.issuedAt).format("YYYY-MM-DD"),
  }));

  const totals = rows.reduce(
    (acc, row) => ({
      total: acc.total + row.total,
      tax: acc.tax + row.tax,
      discount: acc.discount + row.discount,
    }),
    { total: 0, tax: 0, discount: 0 }
  );

  return { rows, totals };
};

const downloadInvoiceReportExcel = asyncHandler(async (req, res) => {
  const { rows, totals } = await getInvoiceReportData(req);
  const buffer = await buildInvoiceReportExcel(rows, totals);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", "attachment; filename=invoice-report.xlsx");
  res.send(buffer);
});

const downloadInvoiceReportPdf = asyncHandler(async (req, res) => {
  const { rows, totals } = await getInvoiceReportData(req);
  const buffer = await buildInvoiceReportPdf(rows, totals);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=invoice-report.pdf");
  res.send(buffer);
});

module.exports = {
  downloadSalesReportExcel,
  downloadSalesReportPdf,
  downloadTaxReportExcel,
  downloadTaxReportPdf,
  downloadInvoiceReportExcel,
  downloadInvoiceReportPdf,
};

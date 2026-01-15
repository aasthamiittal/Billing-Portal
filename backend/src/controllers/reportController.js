const dayjs = require("dayjs");
const Invoice = require("../models/Invoice");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");
const {
  buildSalesReportExcel,
  buildSalesReportPdf,
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
    filter.store = req.user.store;
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

module.exports = { downloadSalesReportExcel, downloadSalesReportPdf };

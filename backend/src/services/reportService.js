const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const buildInvoicePdf = (invoice, items) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Invoice #: ${invoice.invoiceNumber}`);
    doc.text(`Issued At: ${new Date(invoice.issuedAt).toLocaleDateString()}`);
    doc.text(`Customer: ${invoice.customerName || "-"}`);
    doc.moveDown();

    doc.fontSize(10).text("Items", { underline: true });
    doc.moveDown(0.5);
    items.forEach((item) => {
      doc.text(
        `${item.description || "-"} | Qty: ${item.quantity} | Rate: ${item.unitPrice}`
      );
    });

    doc.moveDown();
    doc.text(`Subtotal: ${invoice.totals.subtotal.toFixed(2)}`);
    doc.text(`Tax: ${invoice.totals.tax.toFixed(2)}`);
    doc.text(`Discount: ${invoice.totals.discount.toFixed(2)}`);
    doc.fontSize(12).text(`Total: ${invoice.totals.total.toFixed(2)}`);

    doc.end();
  });

const buildInvoiceExcel = async (invoice, items) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Invoice");

  sheet.addRow(["Invoice", invoice.invoiceNumber]);
  sheet.addRow(["Issued At", new Date(invoice.issuedAt).toLocaleDateString()]);
  sheet.addRow(["Customer", invoice.customerName || "-"]);
  sheet.addRow([]);
  sheet.addRow([
    "Description",
    "Quantity",
    "Unit Price",
    "Tax Rate",
    "Discount",
    "Line Total",
  ]);

  items.forEach((item) => {
    sheet.addRow([
      item.description || "-",
      item.quantity,
      item.unitPrice,
      item.taxRate,
      item.discount,
      item.lineTotal,
    ]);
  });

  sheet.addRow([]);
  sheet.addRow(["Subtotal", invoice.totals.subtotal]);
  sheet.addRow(["Tax", invoice.totals.tax]);
  sheet.addRow(["Discount", invoice.totals.discount]);
  sheet.addRow(["Total", invoice.totals.total]);

  sheet.columns.forEach((column) => {
    column.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const buildSalesReportExcel = async (rows, totals) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sales Report");

  sheet.addRow(["Sales Report"]);
  sheet.addRow([]);
  sheet.addRow(["Invoice #", "Store", "Total", "Issued At"]);

  rows.forEach((row) => {
    sheet.addRow([row.invoiceNumber, row.store, row.total, row.issuedAt]);
  });

  sheet.addRow([]);
  sheet.addRow(["Total Sales", totals.total]);

  sheet.columns.forEach((column) => {
    column.width = 24;
  });

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const buildSalesReportPdf = (rows, totals) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("Sales Report", { align: "center" });
    doc.moveDown();
    rows.forEach((row) => {
      doc
        .fontSize(10)
        .text(`${row.invoiceNumber} | ${row.store} | ${row.total} | ${row.issuedAt}`);
    });
    doc.moveDown();
    doc.fontSize(12).text(`Total Sales: ${totals.total}`);
    doc.end();
  });

module.exports = {
  buildInvoicePdf,
  buildInvoiceExcel,
  buildSalesReportExcel,
  buildSalesReportPdf,
};

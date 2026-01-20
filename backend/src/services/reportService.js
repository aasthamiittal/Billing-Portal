const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

const buildInvoicePdf = (invoice, items) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const storeName = invoice.store?.name || "Store";
    const storeCode = invoice.store?.code ? ` (${invoice.store.code})` : "";
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const money = (n) => `₹${Number(n || 0).toFixed(2)}`;

    // Header background
    const headerHeight = 120;
    doc.rect(0, 0, doc.page.width, headerHeight).fill("#7E5BEF");
    doc.fillColor("white").font("Helvetica-Bold").fontSize(20).text("INVOICE", left, 40);
    doc.font("Helvetica").fontSize(12).text(`${storeName}${storeCode}`, left, 70);

    // Cards
    const cardGap = 16;
    const cardWidth = (pageWidth - cardGap) / 2;
    const cardHeight = 92;
    const cardY = headerHeight + 20;
    const cardStyle = { fill: "#F6F7FB", stroke: "#E5E7EB" };

    const drawCard = (x, y, content) => {
      doc.roundedRect(x, y, cardWidth, cardHeight, 8).fillAndStroke(cardStyle.fill, cardStyle.stroke);
      doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
      content.forEach((row, idx) => {
        const lineY = y + 12 + idx * 22;
        doc.text(row.label, x + 12, lineY);
        doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10);
        doc.text(row.value, x + 12, lineY + 12);
        doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
      });
    };

    drawCard(left, cardY, [
      { label: "INVOICE NUMBER", value: invoice.invoiceNumber },
      { label: "ISSUE DATE", value: new Date(invoice.issuedAt).toLocaleDateString() },
      { label: "PAYMENT TYPE", value: invoice.paymentTypeName || "-" },
    ]);

    // Right card with discount badge
    const rightX = left + cardWidth + cardGap;
    doc.roundedRect(rightX, cardY, cardWidth, cardHeight, 8).fillAndStroke(cardStyle.fill, cardStyle.stroke);
    doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
    doc.text("CUSTOMER NAME", rightX + 12, cardY + 12);
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10);
    doc.text(invoice.customerName || "-", rightX + 12, cardY + 24);
    doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
    doc.text("ORDER TYPE", rightX + 12, cardY + 44);
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10);
    doc.text(invoice.orderTypeName || "-", rightX + 12, cardY + 56);
    doc.fillColor("#6B7280").font("Helvetica").fontSize(8);
    doc.text("DISCOUNT APPLIED", rightX + 12, cardY + 76);
    doc.fillColor("#111827").font("Helvetica-Bold").fontSize(10);
    doc.text(`${Number(invoice.discountValue || 0).toFixed(2)}%`, rightX + 12, cardY + 88);

    // Table header
    let tableY = cardY + cardHeight + 24;
    doc.rect(left, tableY, pageWidth, 22).fill("#F3F4F6");
    doc.fillColor("#374151").font("Helvetica-Bold").fontSize(9);
    doc.text("ITEM", left + 8, tableY + 6);
    doc.text("QTY", left + 260, tableY + 6);
    doc.text("RATE", left + 320, tableY + 6);
    doc.text("TAX %", left + 390, tableY + 6);
    doc.text("LINE TOTAL", left + 460, tableY + 6);

    doc.fillColor("#111827").font("Helvetica").fontSize(10);
    tableY += 30;

    items.forEach((item) => {
      const lineTotal =
        item.lineTotal ??
        item.unitPrice * item.quantity +
          (item.unitPrice * item.quantity * item.taxRate) / 100 -
          (item.discount || 0);
      doc.text(item.description || "-", left + 8, tableY);
      doc.text(String(item.quantity), left + 260, tableY);
      doc.text(money(item.unitPrice || 0), left + 320, tableY);
      doc.text(`${Number(item.taxRate || 0).toFixed(2)}%`, left + 390, tableY);
      doc.text(money(lineTotal || 0), left + 460, tableY);
      tableY += 22;
      doc.moveTo(left, tableY).lineTo(right, tableY).strokeColor("#E5E7EB").stroke();
      tableY += 6;
    });

    // Totals block
    const totalsX = left + pageWidth - 220;
    let totalsY = Math.max(tableY + 16, doc.page.height - 220);
    doc.strokeColor("#E5E7EB");
    doc.fillColor("#111827").font("Helvetica").fontSize(10);
    doc.text("Subtotal:", totalsX, totalsY);
    doc.text(money(invoice.totals.subtotal), totalsX + 120, totalsY, { align: "right", width: 80 });
    totalsY += 16;
    doc.text("Tax:", totalsX, totalsY);
    doc.text(money(invoice.totals.tax), totalsX + 120, totalsY, { align: "right", width: 80 });
    totalsY += 16;
    doc.text("Discount:", totalsX, totalsY);
    doc.text(`-${money(invoice.totals.discount)}`, totalsX + 120, totalsY, { align: "right", width: 80 });
    totalsY += 18;
    doc.moveTo(totalsX, totalsY).lineTo(totalsX + 200, totalsY).stroke();
    totalsY += 12;
    doc.font("Helvetica-Bold").fontSize(12);
    doc.text("Total:", totalsX, totalsY);
    doc.text(money(invoice.totals.total), totalsX + 120, totalsY, { align: "right", width: 80 });

    // Footer
    doc.fillColor("#6B7280").font("Helvetica").fontSize(9);
    doc.text("Thank you for your business!", left, doc.page.height - 40, { align: "center", width: pageWidth });

    doc.end();
  });

const buildInvoiceExcel = async (invoice, items) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Invoice");

  sheet.addRow(["Invoice", invoice.invoiceNumber]);
  sheet.addRow(["Store", invoice.store?.name || "-"]);
  sheet.addRow(["Issued At", new Date(invoice.issuedAt).toLocaleDateString()]);
  sheet.addRow(["Customer", invoice.customerName || "-"]);
  if (invoice.orderTypeName) sheet.addRow(["Order Type", invoice.orderTypeName]);
  if (invoice.paymentTypeName) sheet.addRow(["Payment Type", invoice.paymentTypeName]);
  if (typeof invoice.discountValue === "number") sheet.addRow(["Discount (%)", invoice.discountValue]);
  sheet.addRow([]);
  sheet.addRow([
    "Description",
    "Quantity",
    "Unit Price",
    "Tax Rate",
    "Item Discount",
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

  sheet.columns.forEach((column, idx) => {
    column.width = idx === 1 ? 35 : 18;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
};

const applyReportHeader = (sheet, { storeId, startDate, endDate, reportName }) => {
  sheet.addRow(["Store ID", storeId || "ALL"]);
  sheet.addRow([
    "Dates",
    `${startDate || "-"} - ${endDate || "-"}`,
  ]);
  sheet.addRow(["Report Name", reportName]);
  sheet.addRow([]);
};

const styleHeaderRow = (row) => {
  row.font = { bold: true };
  row.alignment = { horizontal: "center" };
};

const buildSalesReportExcel = async (rows, totals, meta = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Sales Report");

  applyReportHeader(sheet, {
    storeId: meta.storeId,
    startDate: meta.startDate,
    endDate: meta.endDate,
    reportName: "Sales Summary",
  });
  const headerRow = sheet.addRow(["Invoice #", "Store", "Total", "Issued At"]);
  styleHeaderRow(headerRow);

  rows.forEach((row) => {
    sheet.addRow([row.invoiceNumber, row.store, row.total, row.issuedAt]);
  });

  sheet.addRow([]);
  sheet.addRow(["Total Sales", totals.total]);

  sheet.columns.forEach((column) => {
    column.width = 24;
  });
  sheet.getColumn(3).numFmt = "0.00";

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

const buildTaxReportExcel = async (rows, totals, meta = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Tax Report");

  applyReportHeader(sheet, {
    storeId: meta.storeId,
    startDate: meta.startDate,
    endDate: meta.endDate,
    reportName: "Tax Report",
  });
  const headerRow = sheet.addRow(["Invoice #", "Store", "Tax", "Issued At"]);
  styleHeaderRow(headerRow);

  rows.forEach((row) => {
    sheet.addRow([row.invoiceNumber, row.store, row.tax, row.issuedAt]);
  });

  sheet.addRow([]);
  sheet.addRow(["Total Tax", totals.tax]);

  sheet.columns.forEach((column) => {
    column.width = 24;
  });
  sheet.getColumn(3).numFmt = "0.00";

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const buildTaxReportPdf = (rows, totals) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("Tax Report", { align: "center" });
    doc.moveDown();
    rows.forEach((row) => {
      doc.fontSize(10).text(`${row.invoiceNumber} | ${row.store} | ${row.tax} | ${row.issuedAt}`);
    });
    doc.moveDown();
    doc.fontSize(12).text(`Total Tax: ${totals.tax}`);
    doc.end();
  });

const buildInvoiceReportExcel = async (rows, totals, meta = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Invoice Report");

  applyReportHeader(sheet, {
    storeId: meta.storeId,
    startDate: meta.startDate,
    endDate: meta.endDate,
    reportName: "Invoice Summary",
  });
  const headerRow = sheet.addRow(["Invoice #", "Store", "Status", "Total", "Tax", "Discount", "Issued At"]);
  styleHeaderRow(headerRow);

  rows.forEach((row) => {
    sheet.addRow([row.invoiceNumber, row.store, row.status, row.total, row.tax, row.discount, row.issuedAt]);
  });

  sheet.addRow([]);
  sheet.addRow(["Totals", "", "", totals.total, totals.tax, totals.discount, ""]);

  sheet.columns.forEach((column) => {
    column.width = 22;
  });
  sheet.getColumn(4).numFmt = "0.00";
  sheet.getColumn(5).numFmt = "0.00";
  sheet.getColumn(6).numFmt = "0.00";

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const buildInvoiceReportPdf = (rows, totals) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("Invoice Report", { align: "center" });
    doc.moveDown();
    rows.forEach((row) => {
      doc
        .fontSize(10)
        .text(`${row.invoiceNumber} | ${row.store} | ${row.status} | ${row.total} | ${row.issuedAt}`);
    });
    doc.moveDown();
    doc.fontSize(12).text(`Total: ${totals.total} | Tax: ${totals.tax} | Discount: ${totals.discount}`);
    doc.end();
  });

const buildStockReportExcel = async ({ storeId = "", storeName = "", from = "", to = "", rows = [] } = {}) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Stock Report");

  applyReportHeader(sheet, {
    storeId: storeId || storeName || "-",
    startDate: from,
    endDate: to,
    reportName: "Stock Report",
  });
  const headerRow = sheet.addRow(["Item", "Opening", "Purchased", "Sold", "Wasted", "Closing"]);
  styleHeaderRow(headerRow);

  rows.forEach((r) => {
    sheet.addRow([r.itemName, r.opening, r.purchased, r.sold, r.wasted, r.closing]);
  });

  sheet.columns.forEach((column) => {
    column.width = 18;
  });
  sheet.getColumn(2).numFmt = "0.00";
  sheet.getColumn(3).numFmt = "0.00";
  sheet.getColumn(4).numFmt = "0.00";
  sheet.getColumn(5).numFmt = "0.00";
  sheet.getColumn(6).numFmt = "0.00";

  return Buffer.from(await workbook.xlsx.writeBuffer());
};

const buildStockReportPdf = ({ storeName = "", from = "", to = "", rows = [] } = {}) =>
  new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    doc.fontSize(18).text("Stock Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(10).text(`Store: ${storeName || "-"}`);
    doc.text(`From: ${from || "-"}`);
    doc.text(`To: ${to || "-"}`);
    doc.moveDown();

    doc.fontSize(10).text("Item | Opening | Purchased | Sold | Wasted | Closing", { underline: true });
    doc.moveDown(0.5);

    rows.forEach((r) => {
      doc
        .fontSize(9)
        .text(
          `${r.itemName} | ${Number(r.opening || 0).toFixed(2)} | ${Number(r.purchased || 0).toFixed(2)} | ${Number(r.sold || 0).toFixed(2)} | ${Number(r.wasted || 0).toFixed(2)} | ${Number(r.closing || 0).toFixed(2)}`
        );
    });

    doc.end();
  });

module.exports = {
  buildInvoicePdf,
  buildInvoiceExcel,
  buildSalesReportExcel,
  buildSalesReportPdf,
  buildTaxReportExcel,
  buildTaxReportPdf,
  buildInvoiceReportExcel,
  buildInvoiceReportPdf,
  buildStockReportExcel,
  buildStockReportPdf,
};

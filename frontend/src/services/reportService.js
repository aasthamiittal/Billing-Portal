import api from "./api";

export const downloadSalesReportPdf = (params) =>
  api.get("/reports/sales/pdf", { params, responseType: "blob" });

export const downloadSalesReportExcel = (params) =>
  api.get("/reports/sales/excel", { params, responseType: "blob" });

export const fetchSalesReport = (params) => api.get("/reports/sales", { params });

export const downloadTaxReportPdf = (params) =>
  api.get("/reports/tax/pdf", { params, responseType: "blob" });

export const downloadTaxReportExcel = (params) =>
  api.get("/reports/tax/excel", { params, responseType: "blob" });

export const fetchTaxReport = (params) => api.get("/reports/tax", { params });

export const downloadInvoiceReportPdf = (params) =>
  api.get("/reports/invoices/pdf", { params, responseType: "blob" });

export const downloadInvoiceReportExcel = (params) =>
  api.get("/reports/invoices/excel", { params, responseType: "blob" });

export const fetchInvoiceReport = (params) => api.get("/reports/invoices", { params });
import api from "./api";

export const downloadSalesReportPdf = (params) =>
  api.get("/reports/sales/pdf", { params, responseType: "blob" });

export const downloadSalesReportExcel = (params) =>
  api.get("/reports/sales/excel", { params, responseType: "blob" });

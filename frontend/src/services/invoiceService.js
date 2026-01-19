import api from "./api";

export const fetchInvoices = async () => {
  const { data } = await api.get("/invoices");
  return data;
};

export const createInvoice = async (payload) => {
  const { data } = await api.post("/invoices", payload);
  return data;
};

export const downloadInvoicePdf = (id) =>
  api.get(`/invoices/${id}/pdf`, { responseType: "blob" });

export const downloadInvoiceExcel = (id) =>
  api.get(`/invoices/${id}/excel`, { responseType: "blob" });

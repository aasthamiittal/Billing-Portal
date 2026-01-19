import api from "./api";

export const fetchSuppliers = async (storeId) => {
  const { data } = await api.get("/inventory/suppliers", { params: storeId ? { storeId } : undefined });
  return data;
};
export const createSupplier = async (payload) => {
  const { data } = await api.post("/inventory/suppliers", payload);
  return data;
};
export const updateSupplier = async (id, payload) => {
  const { data } = await api.put(`/inventory/suppliers/${id}`, payload);
  return data;
};
export const deleteSupplier = async (id) => {
  const { data } = await api.delete(`/inventory/suppliers/${id}`);
  return data;
};

export const fetchBuyers = async (storeId) => {
  const { data } = await api.get("/inventory/buyers", { params: storeId ? { storeId } : undefined });
  return data;
};
export const createBuyer = async (payload) => {
  const { data } = await api.post("/inventory/buyers", payload);
  return data;
};
export const updateBuyer = async (id, payload) => {
  const { data } = await api.put(`/inventory/buyers/${id}`, payload);
  return data;
};
export const deleteBuyer = async (id) => {
  const { data } = await api.delete(`/inventory/buyers/${id}`);
  return data;
};

export const fetchPurchases = async (storeId) => {
  const { data } = await api.get("/inventory/purchases", { params: storeId ? { storeId } : undefined });
  return data;
};
export const createPurchase = async (payload) => {
  const { data } = await api.post("/inventory/purchases", payload);
  return data;
};

export const fetchWastage = async (storeId) => {
  const { data } = await api.get("/inventory/wastage", { params: storeId ? { storeId } : undefined });
  return data;
};
export const createWastage = async (payload) => {
  const { data } = await api.post("/inventory/wastage", payload);
  return data;
};

export const fetchSold = async (storeId) => {
  const { data } = await api.get("/inventory/sold", { params: storeId ? { storeId } : undefined });
  return data;
};

export const fetchStockReport = async (params) => {
  const { data } = await api.get("/inventory/stock-report", { params });
  return data;
};


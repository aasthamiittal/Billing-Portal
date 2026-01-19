import api from "./api";

export const listCatalog = async (kind, params = {}) => {
  const { data } = await api.get(`/catalog/${kind}`, { params });
  return data;
};

export const createCatalog = async (kind, payload) => {
  const { data } = await api.post(`/catalog/${kind}`, payload);
  return data;
};

export const updateCatalog = async (kind, id, payload) => {
  const { data } = await api.put(`/catalog/${kind}/${id}`, payload);
  return data;
};

export const deactivateCatalog = async (kind, id) => {
  const { data } = await api.delete(`/catalog/${kind}/${id}`);
  return data;
};


import api from "./api";

export const fetchItems = async () => {
  const { data } = await api.get("/items");
  return data;
};

export const createItem = async (payload) => {
  const { data } = await api.post("/items", payload);
  return data;
};

export const updateItem = async (id, payload) => {
  const { data } = await api.put(`/items/${id}`, payload);
  return data;
};

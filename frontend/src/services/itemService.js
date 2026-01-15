import api from "./api";

export const fetchItems = async () => {
  const { data } = await api.get("/items");
  return data;
};

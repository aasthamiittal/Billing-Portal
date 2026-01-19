import api from "./api";

export const fetchStores = async () => {
  const { data } = await api.get("/stores");
  return data;
};

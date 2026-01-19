import api from "./api";

export const fetchIndustries = async () => {
  const { data } = await api.get("/industries");
  return data;
};

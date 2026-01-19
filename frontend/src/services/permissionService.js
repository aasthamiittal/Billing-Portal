import api from "./api";

export const fetchPermissions = async () => {
  const { data } = await api.get("/permissions");
  return data;
};


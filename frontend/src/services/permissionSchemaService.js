import api from "./api";

export const fetchPermissionSchema = async () => {
  const { data } = await api.get("/permission-schema");
  return data;
};


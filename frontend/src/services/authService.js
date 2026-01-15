import api from "./api";

export const login = async (email, password) => {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
};

export const logout = async (refreshToken) => {
  await api.post("/auth/logout", { refreshToken });
};

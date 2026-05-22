import { api } from "./api";

export const authService = {
  login: async (credentials: any) => {
    const res = await api.post("/auth/login", credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },
  logout: async () => {
    await api.post("/auth/logout");
  },
  getUser: async () => {
    const res = await api.get("/auth/user");
    return res.data;
  }
};

import { api } from "./api";
import type { LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, User } from "@/types/auth";

export const authService = {
  login: async (data: LoginRequest) => {
    const res = await api.post("/auth/login", data);
    return res.data as
      | { two_factor_required: true; challenge: string }
      | { access_token: string; user: User };
  },
  verifyTwoFactorLogin: async (challenge: string, code: string) => {
    const res = await api.post("/auth/login/2fa", { challenge, code });
    return res.data as { access_token: string; user: User };
  },
  register: async (data: RegisterRequest) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },
  logout: async () => {
    await api.post("/auth/logout");
  },
  getUser: async () => {
    const res = await api.get("/auth/user");
    return res.data;
  },
  verifyPassword: async (password: string) => {
    const res = await api.post("/auth/verify-password", { password });
    return res.data;
  },
  forgotPassword: async (data: ForgotPasswordRequest) => {
    const res = await api.post("/auth/forgot-password", data);
    return res.data;
  },
  resetPassword: async (data: ResetPasswordRequest) => {
    const res = await api.post("/auth/reset-password", data);
    return res.data;
  },
  updateProfile: async (data: Record<string, unknown>) => {
    const res = await api.put("/auth/user", data);
    return res.data;
  },
};

import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  currency_code: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("auth_token"),
  setAuth: (user, token) => {
    localStorage.setItem("auth_token", token);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    set({ user: null, isAuthenticated: false });
  },
}));

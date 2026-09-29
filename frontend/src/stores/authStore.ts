import { create } from "zustand";
import type { User } from "@/types/auth";
import { authService } from "@/services/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  fetchUser: () => Promise<User | null>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, token) => {
    localStorage.setItem("auth_token", token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  setUser: (user) => {
    set({ user });
  },
  logout: () => {
    localStorage.removeItem("auth_token");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (loading) => {
    set({ isLoading: loading });
  },
  fetchUser: async () => {
    try {
      const user = await authService.getUser();
      set({ user, isAuthenticated: true, isLoading: false });
      return user;
    } catch {
      localStorage.removeItem("auth_token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return null;
    }
  },
  init: async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      set({ token: null, isAuthenticated: false, isLoading: false, user: null });
      return;
    }

    set({ token, isAuthenticated: true, isLoading: true });
    await get().fetchUser();
  },
}));

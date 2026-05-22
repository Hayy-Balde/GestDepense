import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token");
      window.location.href = "/connexion";
    }
    return Promise.reject(error);
  }
);

export const expenseService = {
  getAll: (params?: Record<string, any>) => api.get("/expenses", { params }),
  create: (data: any) => api.post("/expenses", data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
};

export const accountService = {
  getAll: () => api.get("/accounts"),
  getById: (id: string) => api.get(`/accounts/${id}`),
};

export const categoryService = {
  getAll: () => api.get("/categories"),
};

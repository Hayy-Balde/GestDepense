import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:12000/api/v1";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const onLoginPage = window.location.pathname === "/connexion" || window.location.pathname === "/login";
      const hadToken = !!localStorage.getItem("auth_token");
      localStorage.removeItem("auth_token");
      if (hadToken && !onLoginPage) {
        window.location.href = "/connexion";
      }
    }
    return Promise.reject(error);
  }
);

export const expenseService = {
  getAll: (params?: Record<string, unknown>) => api.get("/expenses", { params }),
  getById: (id: string) => api.get(`/expenses/${id}`),
  create: (data: unknown) => api.post("/expenses", data),
  update: (id: string, data: unknown) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
  stats: (params?: Record<string, unknown>) => api.get("/expenses/stats", { params }),
};

export const accountService = {
  getAll: (params?: Record<string, unknown>) => api.get("/accounts", { params }),
  getById: (id: string) => api.get(`/accounts/${id}`),
  create: (data: unknown) => api.post("/accounts", data),
  update: (id: string, data: unknown) => api.put(`/accounts/${id}`, data),
  remove: (id: string, data: unknown) => api.delete(`/accounts/${id}`, { data }),
  apport: (id: string, data: unknown) => api.post(`/accounts/${id}/apport`, data),
  regulate: (id: string, data: unknown) => api.post(`/accounts/${id}/regulate`, data),
  transfer: (id: string, data: unknown) => api.post(`/accounts/${id}/transfer`, data),
};

export const caisseService = {
  getAll: (params?: Record<string, unknown>) => api.get("/caisses", { params }),
  getById: (id: string) => api.get(`/caisses/${id}`),
  create: (data: unknown) => api.post("/caisses", data),
  update: (id: string, data: unknown) => api.put(`/caisses/${id}`, data),
  remove: (id: string, data: unknown) => api.delete(`/caisses/${id}`, { data }),
  fund: (id: string, data: unknown) => api.post(`/caisses/${id}/fund`, data),
  close: (id: string, data: unknown) => api.post(`/caisses/${id}/close`, data),
  transfer: (id: string, data: unknown) => api.post(`/caisses/${id}/transfer`, data),
};

export const movementService = {
  getAll: (params?: Record<string, unknown>) => api.get("/movements", { params }),
  stats: () => api.get("/movements/stats"),
};

export const invoiceService = {
  getAll: (params?: Record<string, unknown>) => api.get("/invoices", { params }),
  getById: (id: string) => api.get(`/invoices/${id}`),
  create: (data: unknown) => api.post("/invoices", data),
  update: (id: string, data: unknown) => api.put(`/invoices/${id}`, data),
  remove: (id: string) => api.delete(`/invoices/${id}`),
  addPayment: (id: string, data: unknown) => api.post(`/invoices/${id}/payments`, data),
};

export const categoryService = {
  getAll: (params?: Record<string, unknown>) => api.get("/categories", { params }),
};

export const quickEntryService = {
  /**
   * Enregistre un lot d'écritures (dépenses et revenus mélangés) en un seul
   * appel. L'API est atomique : si une ligne est invalide, rien n'est écrit et
   * les erreurs reviennent indexées par ligne (`entries.0.amount`).
   */
  create: (entries: unknown) => api.post("/quick-entries", { entries }),
};

export const reportService = {
  summary: (params?: Record<string, unknown>) => api.get("/reports/summary", { params }),
};

export const searchService = {
  global: (params?: Record<string, unknown>) => api.get("/search", { params }),
};

export const notificationService = {
  getAll: () => api.get("/notifications"),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
};

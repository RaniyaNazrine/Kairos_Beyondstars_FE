import axios from "axios";

// Base URL — uses relative path so Vite proxy forwards /api to the backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT token to every outgoing request ──
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: auto-logout on 401 (expired / invalid token) ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear stored credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Notify Navbar and other listeners
      window.dispatchEvent(new Event("storage"));
      // Redirect to login page
      window.location.href = "/auth";
    }
    return Promise.reject(error);
  }
);

export default api;
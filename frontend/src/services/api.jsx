// services/api.jsx
import axios from "axios";

const normalizeBaseURL = (url) => {
  const trimmed = String(url || "").trim().replace(/\/+$/, "");
  if (!trimmed) return "";

  // When a deployed API host is configured without /api, add it automatically.
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (!parsed.pathname || parsed.pathname === "/") {
        return `${trimmed}/api`;
      }
    } catch (_) {
      // Fall through to the string checks below.
    }
  }

  if (trimmed === "/api" || trimmed.endsWith("/api")) {
    return trimmed;
  }

  return trimmed;
};

// Determine appropriate base URL with graceful fallback
const getBaseURL = () => {
  if (process.env.REACT_APP_API_URL) {
    return normalizeBaseURL(process.env.REACT_APP_API_URL);
  }

  if (typeof window !== "undefined") {
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocal) return "http://localhost:5001/api";

    // Set REACT_APP_API_URL for production; this fallback assumes /api
    // is available on the frontend/reverse-proxy domain.
    return "/api";
  }

  return "http://localhost:5001/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000
});

// Request interceptor - add token (pure token storage)
API.interceptors.request.use(
  (req) => {
    const token =
      localStorage.getItem("authToken") ||
      localStorage.getItem("userToken") ||
      localStorage.getItem("adminToken");
    
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors without disrupting login/signup view
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const isAuthPage = typeof window !== "undefined" && 
        (window.location.pathname === "/login" || window.location.pathname === "/signup");

      // Don't force page reload if user is already attempting to login/signup
      if (!isAuthPage) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userToken");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("user");
        localStorage.removeItem("admin");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default API;
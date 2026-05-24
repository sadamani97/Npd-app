// services/api.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5001/api",
  timeout: 10000
});

// Request interceptor - add token (supports both user and admin tokens)
API.interceptors.request.use(
  (req) => {
    // Try user token first, then admin token
    const userToken = localStorage.getItem("userToken");
    const adminToken = localStorage.getItem("adminToken");
    const token = userToken || adminToken;
    
    if (token) {
      req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Remove both tokens on auth failure
      localStorage.removeItem("userToken");
      localStorage.removeItem("adminToken");
      localStorage.removeItem("user");
      localStorage.removeItem("admin");
      
      // Always redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
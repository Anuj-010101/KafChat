import axios from "axios";

// Render ka live backend URL yahan direct set kar diya hai production ke liye
const API_BASE_URL = 
  process.env.NODE_ENV === "production"
    ? "https://kafchat-backend.onrender.com/api"
    : `http://${typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost"}:5000/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: Checks both token keys so no user session fails
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("kafchat_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("kafchat_token") ||
      sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handles expired tokens gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized request.");
    }
    return Promise.reject(error);
  }
);

export default api;
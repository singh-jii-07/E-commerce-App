import axios from "axios";

export const AUTH_BASE_URL = "http://localhost:5000/api";
export const ECOMMERCE_BASE_URL = "http://localhost:5001/api";

// Create instance for Auth Service (Port 5000)
export const authAxios = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create instance for Ecommerce Service (Port 5001)
export const ecommerceAxios = axios.create({
  baseURL: ECOMMERCE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject JWT token into request headers
const addAuthToken = (config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Response error handler
const handleResponseError = (error) => {
  if (error.response && error.response.status === 401) {
    // Token expired or invalid
    if (localStorage.getItem("admin_token")) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      window.location.href = "/login";
    }
  }
  return Promise.reject(error);
};

authAxios.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
authAxios.interceptors.response.use((response) => response, handleResponseError);

ecommerceAxios.interceptors.request.use(addAuthToken, (error) => Promise.reject(error));
ecommerceAxios.interceptors.response.use((response) => response, handleResponseError);

export default {
  authAxios,
  ecommerceAxios,
};

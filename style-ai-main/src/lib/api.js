import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

API.interceptors.request.use((config) => {
  const storeData = localStorage.getItem("aurelia-store");
  if (storeData) {
    try {
      const parsed = JSON.parse(storeData);
      const token = parsed.state?.user?.token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.error("Failed to parse store", e);
    }
  }
  return config;
});

export default API;

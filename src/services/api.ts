// src/services/api.ts
import axios from "axios";
import * as SecureStore from "expo-secure-store";

// غير ده بالـ IP بتاع جهازك
export const BASE_URL = "http://192.168.1.9:5001/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("token");
    }
    return Promise.reject(error);
  }
);

export default api;
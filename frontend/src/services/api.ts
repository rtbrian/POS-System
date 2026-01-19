import axios from 'axios';

// ✅ ONE Base URL for the whole backend
// On Render, this will automatically use your deployed link.
// Locally, it uses port 10000 (where we set up the Gateway).
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Shared Interceptor (Adds Token to ALL requests, Auth & Inventory)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
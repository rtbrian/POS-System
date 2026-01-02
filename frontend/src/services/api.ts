import axios from 'axios';

export const authApi = axios.create({
  baseURL: 'http://localhost:3001/api/auth',
  headers: {
    'Content-Type': 'application/json',
  },
});


export const inventoryApi = axios.create({
  baseURL: 'http://localhost:3002/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

inventoryApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
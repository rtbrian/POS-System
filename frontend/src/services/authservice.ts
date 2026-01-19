// src/services/authservice.ts
import { api } from './api';

// 1. LOGIN (Updated to use your Backend)
export const loginUser = async (email: string, password: string) => {
  try {
    // Send request to your Render Backend (not Supabase directly)
    const response = await api.post('/auth/login', { email, password });
    
    // The backend returns: { user: {...}, token: "..." }
    const { user, token } = response.data;

    // Save to LocalStorage so the app remembers you
    if (token) {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
    }

    return response.data;
  } catch (error: any) {
    console.error("Login Error:", error);
    throw error.response?.data?.message || 'Login failed';
  }
};

// 2. REGISTER (Already Correct - Keep as is)
export const registerUser = async (email: string, password: string) => {
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

// 3. LOGOUT (Updated to clear local data)
export const logoutUser = async () => {
  // We don't need to call the backend for logout with JWTs, 
  // just throw away the key (token).
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// 4. GET CURRENT USER (Updated to read from memory)
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
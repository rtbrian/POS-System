// src/services/authservice.ts
import { supabase } from '../supabase'; // ✅ Matches 'export const' above
import { api } from './api';

export const loginUser = async (email: string, password: string) => {
  try {
    // 1. Direct call to Supabase Auth
    // If this line is red, run: npm install @supabase/supabase-js@latest
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;

    // 2. Save session to LocalStorage (so your app remembers the user)
    if (data.session) {
      localStorage.setItem('token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return { 
      user: data.user, 
      token: data.session?.access_token 
    };

  } catch (error: any) {
    console.error("Login Error:", error.message);
    // Return a clean error message to the UI
    throw error.message || 'Login failed';
  }
};

export const registerUser = async (email: string, password: string) => {
  // This calls POST http://localhost:10000/api/auth/register
  const response = await api.post('/auth/register', { email, password });
  return response.data;
};

export const logoutUser = async () => {
  // 1. Kill Supabase session
  const { error } = await supabase.auth.signOut();
  if (error) console.error("Logout Error:", error.message);

  // 2. Clear LocalStorage
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data.user;
};
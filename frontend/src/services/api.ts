import axios from 'axios';
import { getSupabaseClient } from '../supabase';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (request) => {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw error;
  const accessToken = data.session?.access_token;
  if (accessToken) request.headers.Authorization = `Bearer ${accessToken}`;
  return request;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      await getSupabaseClient().auth.signOut();
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ error?: { message?: string }; message?: string }>(error)) {
    return error.response?.data?.error?.message
      ?? error.response?.data?.message
      ?? error.message
      ?? fallback;
  }
  if (error instanceof Error) return error.message;
  return fallback;
};

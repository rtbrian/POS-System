import { getSupabaseClient } from '../supabase';

export const loginUser = async (email: string, password: string) => {
  const { data, error } = await getSupabaseClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
};

export const registerUser = async (email: string, password: string) => {
  const { data, error } = await getSupabaseClient().auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data;
};

export const logoutUser = async (): Promise<void> => {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error) throw error;
  return data.user;
};

import { createClient } from '@supabase/supabase-js';

// These variables come from your Vercel Environment Settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if keys are missing (helps debug white screens)
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key. Check your .env or Vercel Settings.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://axhovhumajbutzcdlilf.supabase.co';
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

let client: SupabaseClient | undefined;

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseKey) {
    throw new Error('Set VITE_SUPABASE_PUBLISHABLE_KEY in frontend/.env.local to enable authentication.');
  }
  client ??= createClient(supabaseUrl, supabaseKey);
  return client;
};

import { createClient } from '@supabase/supabase-js';
import { config } from './env.config';

export const supabaseAuth = createClient(config.supabaseUrl, config.supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

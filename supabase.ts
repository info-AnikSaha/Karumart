import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    if (!supabaseInstance) {
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        throw new Error('Supabase URL and Anon Key are required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Settings > Secrets menu.');
      }
      
      supabaseInstance = createClient(url, key);
    }
    return (supabaseInstance as any)[prop];
  }
});

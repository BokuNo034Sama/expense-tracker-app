import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  as string;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('[KINY] Missing Supabase environment variables. Check .env.local');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession:    true,          // Session stored in localStorage by Supabase
    autoRefreshToken:  true,
    detectSessionInUrl: true,         // Required for magic link auth
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// Helper: get current authenticated user ID — throws if not logged in
export async function getUID(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('[KINY] Not authenticated');
  return user.id;
}

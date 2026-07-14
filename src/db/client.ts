import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function createDb(url: string, serviceKey: string): SupabaseClient {
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

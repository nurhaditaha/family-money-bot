import type { SupabaseClient } from '@supabase/supabase-js';

export async function isAuthorized(db: SupabaseClient, telegramId: number): Promise<boolean> {
  const { data, error } = await db
    .from('users')
    .select('id')
    .eq('telegram_id', telegramId)
    .maybeSingle();

  if (error) throw new Error(`Auth check failed: ${(error as { message: string }).message}`);

  return data !== null;
}

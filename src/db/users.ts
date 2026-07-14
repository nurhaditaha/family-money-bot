import type { SupabaseClient } from '@supabase/supabase-js';

export async function addUser(db: SupabaseClient, telegramId: number, name: string): Promise<void> {
  const { error } = await db.from('users').insert({ telegram_id: telegramId, name });
  if (error) throw new Error(`addUser failed: ${(error as { message: string }).message}`);
}

export async function removeUser(db: SupabaseClient, telegramId: number): Promise<void> {
  const { error } = await db.from('users').delete().eq('telegram_id', telegramId);
  if (error) throw new Error(`removeUser failed: ${(error as { message: string }).message}`);
}

export async function countUsers(db: SupabaseClient): Promise<number> {
  const { data, error } = await db.from('users').select('telegram_id');
  if (error) throw new Error(`countUsers failed: ${(error as { message: string }).message}`);
  return (data ?? []).length;
}

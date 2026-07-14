import type { SupabaseClient } from '@supabase/supabase-js';

export interface Session {
  command: string;
  step: string;
  data: Record<string, unknown>;
}

export async function getSession(db: SupabaseClient, telegramId: number): Promise<Session | null> {
  const { data, error } = await db
    .from('sessions')
    .select('command, step, data')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  if (error) throw new Error(`getSession failed: ${(error as { message: string }).message}`);
  return data as Session | null;
}

export async function setSession(db: SupabaseClient, telegramId: number, session: Session): Promise<void> {
  const { error } = await db
    .from('sessions')
    .upsert({ telegram_id: telegramId, ...session, updated_at: new Date().toISOString() });
  if (error) throw new Error(`setSession failed: ${(error as { message: string }).message}`);
}

export async function clearSession(db: SupabaseClient, telegramId: number): Promise<void> {
  const { error } = await db.from('sessions').delete().eq('telegram_id', telegramId);
  if (error) throw new Error(`clearSession failed: ${(error as { message: string }).message}`);
}

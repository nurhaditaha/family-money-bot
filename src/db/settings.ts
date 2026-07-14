import type { SupabaseClient } from '@supabase/supabase-js';

export async function setDefaultCurrency(db: SupabaseClient, code: string): Promise<void> {
  const { error } = await db.from('settings').update({ value: code }).eq('key', 'default_currency');
  if (error) throw new Error(`setDefaultCurrency failed: ${(error as { message: string }).message}`);
}

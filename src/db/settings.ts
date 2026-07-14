import type { SupabaseClient } from '@supabase/supabase-js';

export async function setDefaultCurrency(db: SupabaseClient, code: string): Promise<void> {
  const { error } = await db.from('settings').update({ value: code }).eq('key', 'default_currency');
  if (error) throw new Error(`setDefaultCurrency failed: ${(error as { message: string }).message}`);
}

export async function getDefaultCurrency(db: SupabaseClient): Promise<string> {
  const { data, error } = await db.from('settings').select('value').eq('key', 'default_currency').maybeSingle();
  if (error) throw new Error(`getDefaultCurrency failed: ${(error as { message: string }).message}`);
  // Falls back to 'SGD' if the row is somehow missing — it's always seeded by
  // the Task 2 migration, but a missing row shouldn't crash the /log flow.
  return (data as { value: string } | null)?.value ?? 'SGD';
}

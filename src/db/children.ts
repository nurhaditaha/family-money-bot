import type { SupabaseClient } from '@supabase/supabase-js';

export interface Child {
  id: string;
  name: string;
}

export async function listChildren(db: SupabaseClient): Promise<Child[]> {
  const { data, error } = await db.from('children').select('id, name').order('name');
  if (error) throw new Error(`listChildren failed: ${(error as { message: string }).message}`);
  return (data ?? []) as Child[];
}

export async function addChild(db: SupabaseClient, name: string): Promise<void> {
  const { error } = await db.from('children').insert({ name });
  if (error) throw new Error(`addChild failed: ${(error as { message: string }).message}`);
}

export async function renameChild(db: SupabaseClient, childId: string, name: string): Promise<void> {
  const { error } = await db.from('children').update({ name }).eq('id', childId);
  if (error) throw new Error(`renameChild failed: ${(error as { message: string }).message}`);
}

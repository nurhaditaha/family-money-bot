import type { SupabaseClient } from '@supabase/supabase-js';

export interface Gift {
  id: string;
  short_id: string;
  amount: number;
  currency: string;
  giver: string | null;
  occasion: string | null;
  note: string | null;
  banked: boolean;
}

export async function findGiftByShortId(db: SupabaseClient, shortId: string): Promise<Gift | null> {
  const { data, error } = await db.from('gifts').select('*').eq('short_id', shortId).maybeSingle();
  if (error) throw new Error(`findGiftByShortId failed: ${(error as { message: string }).message}`);
  return data as Gift | null;
}

const EDITABLE_FIELDS = ['amount', 'currency', 'giver', 'occasion', 'note', 'banked'] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];
export function isEditableField(value: string): value is EditableField {
  return (EDITABLE_FIELDS as readonly string[]).includes(value);
}

export async function updateGiftField(
  db: SupabaseClient,
  giftId: string,
  field: EditableField,
  value: unknown
): Promise<void> {
  const { error } = await db.from('gifts').update({ [field]: value }).eq('id', giftId);
  if (error) throw new Error(`updateGiftField failed: ${(error as { message: string }).message}`);
}

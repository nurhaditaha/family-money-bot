import type { SupabaseClient } from '@supabase/supabase-js';

export interface NewGift {
  shortId: string;
  childId: string;
  amount: number;
  currency: string;
  giver: string | null;
  occasion: string | null;
  note: string | null;
  banked: boolean;
  createdBy: string;
}

export async function insertGift(db: SupabaseClient, gift: NewGift): Promise<void> {
  const { error } = await db.from('gifts').insert({
    short_id: gift.shortId,
    child_id: gift.childId,
    amount: gift.amount,
    currency: gift.currency,
    giver: gift.giver,
    occasion: gift.occasion,
    note: gift.note,
    banked: gift.banked,
    created_by: gift.createdBy,
  });
  if (error) throw new Error(`insertGift failed: ${(error as { message: string }).message}`);
}

export async function distinctOccasions(db: SupabaseClient): Promise<string[]> {
  const { data, error } = await db.from('gifts').select('occasion').not('occasion', 'is', null);
  if (error) throw new Error(`distinctOccasions failed: ${(error as { message: string }).message}`);
  const set = new Set((data ?? []).map((row) => (row as { occasion: string }).occasion));
  return Array.from(set);
}

export async function distinctCurrencies(db: SupabaseClient): Promise<string[]> {
  const { data, error } = await db.from('gifts').select('currency');
  if (error) throw new Error(`distinctCurrencies failed: ${(error as { message: string }).message}`);
  const set = new Set((data ?? []).map((row) => (row as { currency: string }).currency));
  return Array.from(set);
}

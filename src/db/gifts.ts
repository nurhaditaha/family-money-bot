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

export interface UnbankedGift {
  id: string;
  short_id: string;
  amount: number;
  currency: string;
  child_id: string;
  childName: string;
}

export async function listUnbanked(db: SupabaseClient): Promise<UnbankedGift[]> {
  const { data, error } = await db
    .from('gifts')
    .select('id, short_id, amount, currency, child_id, children(name)')
    .eq('banked', false);
  if (error) throw new Error(`listUnbanked failed: ${(error as { message: string }).message}`);
  return ((data ?? []) as unknown[]).map((row) => {
    const r = row as {
      id: string;
      short_id: string;
      amount: number;
      currency: string;
      child_id: string;
      children: { name: string } | { name: string }[];
    };
    const child = Array.isArray(r.children) ? r.children[0] : r.children;
    return {
      id: r.id,
      short_id: r.short_id,
      amount: r.amount,
      currency: r.currency,
      child_id: r.child_id,
      childName: child?.name ?? '',
    };
  });
}

export async function markBanked(db: SupabaseClient, giftIds: string[]): Promise<void> {
  const { error } = await db.from('gifts').update({ banked: true }).in('id', giftIds);
  if (error) throw new Error(`markBanked failed: ${(error as { message: string }).message}`);
}

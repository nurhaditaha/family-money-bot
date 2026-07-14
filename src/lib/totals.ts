export interface GiftAmount {
  currency: string;
  amount: number;
}

export function groupTotalsByCurrency(gifts: GiftAmount[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const gift of gifts) {
    totals[gift.currency] = (totals[gift.currency] ?? 0) + gift.amount;
  }
  return totals;
}

export function formatTotals(totals: Record<string, number>): string {
  const entries = Object.entries(totals);
  if (entries.length === 0) return 'No gifts logged yet';
  return entries.map(([currency, amount]) => `${currency} ${amount}`).join(', ');
}

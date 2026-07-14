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
  return entries
    .map(([currency, amount]) => `${currency} ${formatAmount(amount)}`)
    .join(', ');
}

// Round to 2dp to avoid floating-point artifacts (e.g. 0.1 + 0.2 = 0.30000000000000004),
// then strip a trailing ".00" so whole amounts display as "80" rather than "80.00".
function formatAmount(amount: number): string {
  return amount.toFixed(2).replace(/\.00$/, '');
}

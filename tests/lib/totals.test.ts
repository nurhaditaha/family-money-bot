import { describe, it, expect } from 'vitest';
import { groupTotalsByCurrency, formatTotals } from '../../src/lib/totals';

describe('groupTotalsByCurrency', () => {
  it('sums amounts within the same currency', () => {
    const result = groupTotalsByCurrency([
      { currency: 'SGD', amount: 50 },
      { currency: 'SGD', amount: 30 },
    ]);
    expect(result).toEqual({ SGD: 80 });
  });

  it('keeps different currencies separate rather than summing them', () => {
    const result = groupTotalsByCurrency([
      { currency: 'SGD', amount: 50 },
      { currency: 'MYR', amount: 20 },
    ]);
    expect(result).toEqual({ SGD: 50, MYR: 20 });
  });

  it('returns an empty object for no gifts', () => {
    expect(groupTotalsByCurrency([])).toEqual({});
  });
});

describe('formatTotals', () => {
  it('formats a single currency', () => {
    expect(formatTotals({ SGD: 80 })).toBe('SGD 80');
  });

  it('formats multiple currencies, comma-separated', () => {
    expect(formatTotals({ SGD: 800, MYR: 70 })).toBe('SGD 800, MYR 70');
  });

  it('returns a placeholder string for no totals', () => {
    expect(formatTotals({})).toBe('No gifts logged yet');
  });
});

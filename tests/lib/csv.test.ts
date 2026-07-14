import { describe, it, expect } from 'vitest';
import { toCsv } from '../../src/lib/csv';

describe('toCsv', () => {
  it('renders a header row and one row per record', () => {
    const csv = toCsv(
      ['child', 'amount', 'currency'],
      [
        { child: 'Aisyah', amount: 50, currency: 'SGD' },
        { child: 'Danish', amount: 30, currency: 'SGD' },
      ]
    );
    expect(csv).toBe('child,amount,currency\nAisyah,50,SGD\nDanish,30,SGD');
  });

  it('quotes fields containing commas', () => {
    const csv = toCsv(['note'], [{ note: 'from Aunty, with love' }]);
    expect(csv).toBe('note\n"from Aunty, with love"');
  });

  it('returns just the header for no records', () => {
    expect(toCsv(['a', 'b'], [])).toBe('a,b');
  });
});

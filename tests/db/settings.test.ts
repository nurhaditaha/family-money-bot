import { describe, it, expect } from 'vitest';
import { getDefaultCurrency, setDefaultCurrency } from '../../src/db/settings';
import { createMockDb } from '../helpers/mockDb';

describe('getDefaultCurrency', () => {
  it('returns the configured value when a row exists', async () => {
    const db = createMockDb({ settings: { data: { value: 'MYR' }, error: null } });
    expect(await getDefaultCurrency(db)).toBe('MYR');
  });

  it('falls back to "SGD" when the settings row is missing', async () => {
    const db = createMockDb({ settings: { data: null, error: null } });
    expect(await getDefaultCurrency(db)).toBe('SGD');
  });

  it('throws when the query errors', async () => {
    const db = createMockDb({ settings: { data: null, error: { message: 'Database error' } } });
    await expect(getDefaultCurrency(db)).rejects.toThrow('Database error');
  });
});

describe('setDefaultCurrency', () => {
  it('updates without throwing on success', async () => {
    const db = createMockDb({ settings: { data: null, error: null } });
    await expect(setDefaultCurrency(db, 'MYR')).resolves.toBeUndefined();
  });

  it('throws when the update errors', async () => {
    const db = createMockDb({ settings: { data: null, error: { message: 'Database error' } } });
    await expect(setDefaultCurrency(db, 'MYR')).rejects.toThrow('Database error');
  });
});

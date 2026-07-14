import { describe, it, expect } from 'vitest';
import { isAuthorized } from '../src/auth';
import { createMockDb } from './helpers/mockDb';

describe('isAuthorized', () => {
  it('returns true when the telegram_id is in the users table', async () => {
    const db = createMockDb({ users: { data: { id: 'u1' }, error: null } });
    expect(await isAuthorized(db, 123)).toBe(true);
  });

  it('returns false when no matching user exists', async () => {
    const db = createMockDb({ users: { data: null, error: null } });
    expect(await isAuthorized(db, 123)).toBe(false);
  });

  it('throws when the query errors', async () => {
    const db = createMockDb({ users: { data: null, error: { message: 'connection failed' } } });
    await expect(isAuthorized(db, 123)).rejects.toThrow('Auth check failed: connection failed');
  });
});

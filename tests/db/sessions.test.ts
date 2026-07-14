import { describe, it, expect } from 'vitest';
import { getSession, setSession, clearSession } from '../../src/db/sessions';
import { createMockDb } from '../helpers/mockDb';

describe('getSession', () => {
  it('returns the session when one exists', async () => {
    const db = createMockDb({
      sessions: { data: { command: 'log', step: 'amount', data: { childId: 'c1' } }, error: null },
    });
    expect(await getSession(db, 123)).toEqual({ command: 'log', step: 'amount', data: { childId: 'c1' } });
  });

  it('returns null when there is no active session', async () => {
    const db = createMockDb({ sessions: { data: null, error: null } });
    expect(await getSession(db, 123)).toBeNull();
  });
});

describe('setSession', () => {
  it('upserts without throwing on success', async () => {
    const db = createMockDb({ sessions: { data: null, error: null } });
    await expect(
      setSession(db, 123, { command: 'log', step: 'amount', data: {} })
    ).resolves.toBeUndefined();
  });
});

describe('clearSession', () => {
  it('deletes without throwing on success', async () => {
    const db = createMockDb({ sessions: { data: null, error: null } });
    await expect(clearSession(db, 123)).resolves.toBeUndefined();
  });
});

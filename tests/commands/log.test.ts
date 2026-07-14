import { describe, it, expect, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { handleLog, continueLog } from '../../src/commands/log';
import { createMockDb } from '../helpers/mockDb';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    db: createMockDb({ children: { data: [{ id: 'c1', name: 'Aisyah' }], error: null } }),
    api: { sendMessage: vi.fn() } as never,
    telegramId: 123,
    update: { message: { text: 'Aisyah' } } as never,
    session: null,
    ...overrides,
  };
}

// Digs the payload of the first `upsert` call made against a given table,
// so tests can assert on exactly what got persisted to the session.
function lastUpsertPayload(db: SupabaseClient, table: string): { data: Record<string, unknown> } {
  const fromMock = (db as unknown as { from: ReturnType<typeof vi.fn> }).from;
  const calls = fromMock.mock.calls as Array<[string]>;
  const results = fromMock.mock.results as Array<{ value: { upsert: ReturnType<typeof vi.fn> } }>;
  const index = calls.findIndex((call) => call[0] === table);
  if (index === -1) throw new Error(`no call to db.from("${table}") was recorded`);
  const upsertMock = results[index]?.value.upsert;
  if (!upsertMock) throw new Error(`db.from("${table}") chain has no upsert mock`);
  const firstCall = upsertMock.mock.calls[0];
  if (!firstCall) throw new Error(`upsert was never called on db.from("${table}")`);
  return firstCall[0] as { data: Record<string, unknown> };
}

describe('handleLog', () => {
  it('starts the flow by asking which child, and sets session step to "child"', async () => {
    const ctx = makeCtx();

    await handleLog(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Which child')
    );
  });
});

describe('continueLog', () => {
  it('re-prompts without advancing on a not-found child name, preserving session state', async () => {
    const ctx = makeCtx({
      session: { command: 'log', step: 'child', data: {} },
      update: { message: { text: 'Nobody' } },
    });

    await continueLog(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining("don't recognize")
    );
  });

  it('advances from the "amount" step to "currency" on valid numeric input', async () => {
    const ctx = makeCtx({
      session: { command: 'log', step: 'amount', data: { childId: 'c1', childName: 'Aisyah' } },
      update: { message: { text: '50' } },
    });

    await continueLog(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Currency')
    );
  });

  it('re-prompts without advancing on non-numeric amount input', async () => {
    const ctx = makeCtx({
      session: { command: 'log', step: 'amount', data: { childId: 'c1', childName: 'Aisyah' } },
      update: { message: { text: 'fifty' } },
    });

    await continueLog(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining("didn't look like a number")
    );
  });

  it('re-prompts without advancing on an invalid currency code', async () => {
    const ctx = makeCtx({
      session: {
        command: 'log',
        step: 'currency',
        data: { childId: 'c1', childName: 'Aisyah', amount: 50 },
      },
      update: { message: { text: '12' } },
    });

    await continueLog(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('3-letter code')
    );
  });

  it('rejects a 4-letter currency code like "SGDD"', async () => {
    const ctx = makeCtx({
      session: {
        command: 'log',
        step: 'currency',
        data: { childId: 'c1', childName: 'Aisyah', amount: 50 },
      },
      update: { message: { text: 'SGDD' } },
    });

    await continueLog(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('3-letter code')
    );
  });

  it('advances from the "giver" step to "occasion" on free-text input, using distinctOccasions via the mock\'s .not() support', async () => {
    const ctx = makeCtx({
      db: createMockDb({
        children: { data: [{ id: 'c1', name: 'Aisyah' }], error: null },
        gifts: { data: [{ occasion: 'Raya' }, { occasion: 'Birthday' }], error: null },
      }),
      session: {
        command: 'log',
        step: 'giver',
        data: { childId: 'c1', childName: 'Aisyah', amount: 50, currency: 'SGD' },
      },
      update: { message: { text: 'Aunty Zainab' } },
    });

    await continueLog(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Occasion')
    );
  });

  it('nulls out the giver field when the user types "skip"', async () => {
    const db = createMockDb({
      children: { data: [{ id: 'c1', name: 'Aisyah' }], error: null },
      gifts: { data: [], error: null },
    });
    const ctx = makeCtx({
      db,
      session: {
        command: 'log',
        step: 'giver',
        data: { childId: 'c1', childName: 'Aisyah', amount: 50, currency: 'SGD' },
      },
      update: { message: { text: 'skip' } },
    });

    await continueLog(ctx as never);

    expect(lastUpsertPayload(db, 'sessions').data.giver).toBeNull();
    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Occasion')
    );
  });

  it('advances from the "occasion" step to "note", nulling occasion out when "skip" is typed', async () => {
    const db = createMockDb({ children: { data: [{ id: 'c1', name: 'Aisyah' }], error: null } });
    const ctx = makeCtx({
      db,
      session: {
        command: 'log',
        step: 'occasion',
        data: { childId: 'c1', childName: 'Aisyah', amount: 50, currency: 'SGD', giver: null },
      },
      update: { message: { text: 'skip' } },
    });

    await continueLog(ctx as never);

    expect(lastUpsertPayload(db, 'sessions').data.occasion).toBeNull();
    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('notes')
    );
  });

  it('advances from the "note" step to "banked", nulling note out when "skip" is typed', async () => {
    const db = createMockDb({ children: { data: [{ id: 'c1', name: 'Aisyah' }], error: null } });
    const ctx = makeCtx({
      db,
      session: {
        command: 'log',
        step: 'note',
        data: { childId: 'c1', childName: 'Aisyah', amount: 50, currency: 'SGD', giver: null, occasion: null },
      },
      update: { message: { text: 'skip' } },
    });

    await continueLog(ctx as never);

    expect(lastUpsertPayload(db, 'sessions').data.note).toBeNull();
    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('banked')
    );
  });

  it('completes the flow and confirms with a short ID when the last step (banked) is answered', async () => {
    const ctx = makeCtx({
      session: {
        command: 'log',
        step: 'banked',
        data: { childId: 'c1', childName: 'Aisyah', amount: 50, currency: 'SGD', giver: 'Aunty Zainab', occasion: 'Raya', note: null },
      },
      update: { message: { text: 'No' } },
    });

    await continueLog(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Logged')
    );
  });
});

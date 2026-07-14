import { describe, it, expect, vi } from 'vitest';
import { handleTotal, handleTotals } from '../../src/commands/totals';
import { createMockDb } from '../helpers/mockDb';

describe('handleTotal', () => {
  it('reports usage when no child name is given', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ children: { data: [], error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/total' } },
      session: null,
    };

    await handleTotal(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Usage'));
  });

  it('reports a not-found message for an unrecognized child', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ children: { data: [], error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/total Nobody' } },
      session: null,
    };

    await handleTotal(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining("don't recognize"));
  });

  it('reports grouped totals for a recognized child', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({
        children: { data: [{ id: 'c1', name: 'Aisyah' }], error: null },
        gifts: { data: [{ currency: 'SGD', amount: 800 }, { currency: 'MYR', amount: 70 }], error: null },
      }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/total Aisyah' } },
      session: null,
    };

    await handleTotal(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('SGD 800, MYR 70'));
  });
});

describe('handleTotals', () => {
  it('reports totals per child', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ gifts: { data: [{ currency: 'SGD', amount: 800, children: { name: 'Aisyah' } }], error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: {},
      session: null,
    };

    await handleTotals(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Aisyah'));
  });

  it('reports an empty-state message when there are no gifts at all', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ gifts: { data: [], error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: {},
      session: null,
    };

    await handleTotals(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('No gifts logged yet'));
  });

  it('handles the children relation coming back as a single-element array', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({
        gifts: { data: [{ currency: 'SGD', amount: 800, children: [{ name: 'Aisyah' }] }], error: null },
      }),
      api: { sendMessage },
      telegramId: 123,
      update: {},
      session: null,
    };

    await handleTotals(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Aisyah'));
  });
});

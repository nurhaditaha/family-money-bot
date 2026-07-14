import { describe, it, expect, vi } from 'vitest';
import { handleBank, toggleBankSelection, confirmBank } from '../../src/commands/bank';
import { createMockDb } from '../helpers/mockDb';

describe('handleBank', () => {
  it('lists unbanked entries as selectable buttons', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ gifts: { data: [{ id: 'g1', short_id: 'A7F2', amount: 50, currency: 'SGD', child_id: 'c1', children: { name: 'Aisyah' } }], error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: {},
      session: null,
    };

    await handleBank(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('A7F2'), expect.anything());
  });

  it('tells the user when nothing is unbanked', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ gifts: { data: [], error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: {},
      session: null,
    };

    await handleBank(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Nothing to bank'));
  });
});

describe('toggleBankSelection', () => {
  it('adds an unselected id to the session selection', async () => {
    const answerCallbackQuery = vi.fn();
    const ctx = {
      db: createMockDb({}),
      api: { answerCallbackQuery, sendMessage: vi.fn() },
      telegramId: 123,
      update: { callback_query: { id: 'cbq1', data: 'bank:toggle:g1', message: { chat: { id: 123 }, message_id: 1 } } },
      session: { command: 'bank', step: 'select', data: { selected: [] } },
    };

    await toggleBankSelection(ctx as never);

    expect(answerCallbackQuery).toHaveBeenCalledWith('cbq1');
  });

  it('removes an already-selected id on a second tap (deselect)', async () => {
    const answerCallbackQuery = vi.fn();
    let savedData: Record<string, unknown> | undefined;
    const db = createMockDb({});
    const originalFrom = db.from.bind(db);
    (db.from as unknown as (table: string) => unknown) = ((table: string) => {
      const chain = originalFrom(table) as unknown as Record<string, unknown>;
      if (table === 'sessions') {
        const upsert = vi.fn((row: Record<string, unknown>) => {
          savedData = row.data as Record<string, unknown>;
          return chain;
        });
        (chain as Record<string, unknown>).upsert = upsert;
      }
      return chain;
    }) as never;

    const ctx = {
      db,
      api: { answerCallbackQuery, sendMessage: vi.fn() },
      telegramId: 123,
      update: { callback_query: { id: 'cbq1', data: 'bank:toggle:g1', message: { chat: { id: 123 }, message_id: 1 } } },
      session: { command: 'bank', step: 'select', data: { selected: ['g1'] } },
    };

    await toggleBankSelection(ctx as never);

    expect(answerCallbackQuery).toHaveBeenCalledWith('cbq1');
    expect(savedData?.selected).toEqual([]);
  });
});

describe('confirmBank', () => {
  it('marks the selected gifts banked and reports the total', async () => {
    const sendMessage = vi.fn();
    const answerCallbackQuery = vi.fn();
    const ctx = {
      db: createMockDb({ gifts: { data: null, error: null } }),
      api: { sendMessage, answerCallbackQuery },
      telegramId: 123,
      update: { callback_query: { id: 'cbq2', data: 'bank:confirm', message: { chat: { id: 123 }, message_id: 1 } } },
      session: {
        command: 'bank',
        step: 'select',
        data: { selected: ['g1', 'g2'], entries: [{ id: 'g1', currency: 'SGD', amount: 50 }, { id: 'g2', currency: 'SGD', amount: 30 }] },
      },
    };

    await confirmBank(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('SGD 80'));
  });

  it('tells the user to select at least one entry when confirming with zero selected', async () => {
    const sendMessage = vi.fn();
    const answerCallbackQuery = vi.fn();
    const ctx = {
      db: createMockDb({ gifts: { data: null, error: null } }),
      api: { sendMessage, answerCallbackQuery },
      telegramId: 123,
      update: { callback_query: { id: 'cbq3', data: 'bank:confirm', message: { chat: { id: 123 }, message_id: 1 } } },
      session: {
        command: 'bank',
        step: 'select',
        data: { selected: [], entries: [{ id: 'g1', currency: 'SGD', amount: 50 }] },
      },
    };

    await confirmBank(ctx as never);

    expect(answerCallbackQuery).toHaveBeenCalledWith('cbq3', expect.stringContaining('Select at least one'));
    expect(sendMessage).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { handleUnbanked } from '../../src/commands/unbanked';
import { createMockDb } from '../helpers/mockDb';

describe('handleUnbanked', () => {
  it('lists unbanked entries grouped by child with short IDs', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({
        gifts: {
          data: [
            { id: 'g1', short_id: 'A7F2', amount: 50, currency: 'SGD', child_id: 'c1', children: { name: 'Aisyah' } },
            { id: 'g2', short_id: 'B3C1', amount: 30, currency: 'SGD', child_id: 'c2', children: { name: 'Danish' } },
          ],
          error: null,
        },
      }),
      api: { sendMessage },
      telegramId: 123,
      update: {},
      session: null,
    };

    await handleUnbanked(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('A7F2'));
    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Aisyah'));
    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('B3C1'));
    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Danish'));
  });

  it('says everything is banked when the list is empty', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ gifts: { data: [], error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: {},
      session: null,
    };

    await handleUnbanked(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Everything'));
  });
});

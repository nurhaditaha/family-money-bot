import { describe, it, expect, vi } from 'vitest';
import { handleHelp } from '../../src/commands/help';
import { createMockDb } from '../helpers/mockDb';

describe('handleHelp', () => {
  it('sends a message listing every command', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({}),
      api: { sendMessage } as never,
      telegramId: 123,
      update: {} as never,
      session: null,
    };

    await handleHelp(ctx);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('/log'));
    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('/bank'));
  });
});

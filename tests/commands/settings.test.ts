import { describe, it, expect, vi } from 'vitest';
import { handleSetDefaultCurrency } from '../../src/commands/settings';
import { createMockDb } from '../helpers/mockDb';

describe('handleSetDefaultCurrency', () => {
  it('rejects a code that is not 3 letters', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({}),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/setdefaultcurrency Singapore Dollar' } },
      session: null,
    };

    await handleSetDefaultCurrency(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('3-letter'));
  });

  it('rejects a code with numbers', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({}),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/setdefaultcurrency SG1' } },
      session: null,
    };

    await handleSetDefaultCurrency(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('3-letter'));
  });

  it('updates the default currency and confirms with uppercase code', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ settings: { data: null, error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/setdefaultcurrency MYR' } },
      session: null,
    };

    await handleSetDefaultCurrency(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('MYR'));
  });

  it('uppercases lowercase input', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ settings: { data: null, error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/setdefaultcurrency sgd' } },
      session: null,
    };

    await handleSetDefaultCurrency(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('SGD'));
  });

  it('strips the @BotName suffix used in group-chat command syntax', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ settings: { data: null, error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/setdefaultcurrency@SomeBotName MYR' } },
      session: null,
    };

    await handleSetDefaultCurrency(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('MYR'));
  });

  it('reports error when database update fails', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ settings: { data: null, error: { message: 'Database error' } } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/setdefaultcurrency MYR' } },
      session: null,
    };

    try {
      await handleSetDefaultCurrency(ctx as never);
    } catch (e) {
      expect(String(e)).toContain('Database error');
    }
  });
});

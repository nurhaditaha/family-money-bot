import { describe, it, expect, vi } from 'vitest';
import { handleAddUser, handleRemoveUser } from '../../src/commands/users';
import { createMockDb } from '../helpers/mockDb';

describe('handleAddUser', () => {
  it('rejects malformed usage', async () => {
    const sendMessage = vi.fn();
    const ctx = { db: createMockDb({}), api: { sendMessage }, telegramId: 123, update: { message: { text: '/adduser' } }, session: null };

    await handleAddUser(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Usage'));
  });

  it('rejects a non-numeric telegram_id', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({}),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/adduser abc SomeName' } },
      session: null,
    };

    await handleAddUser(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Usage'));
  });

  it('adds the user and confirms', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ users: { data: null, error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/adduser 999 Assistant' } },
      session: null,
    };

    await handleAddUser(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Assistant'));
  });

  it('supports multi-word names after the telegram_id', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ users: { data: null, error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/adduser 999 Jane Doe' } },
      session: null,
    };

    await handleAddUser(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Jane Doe'));
  });

  it('strips the @BotName suffix used in group-chat command syntax', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ users: { data: null, error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/adduser@SomeBotName 999 Assistant' } },
      session: null,
    };

    await handleAddUser(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Assistant'));
  });
});

describe('handleRemoveUser', () => {
  it('rejects malformed usage', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({}),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/removeuser' } },
      session: null,
    };

    await handleRemoveUser(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Usage'));
  });

  it('removes the user and confirms', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ users: { data: [{ telegram_id: 123 }, { telegram_id: 999 }], error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/removeuser 999' } },
      session: null,
    };

    await handleRemoveUser(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('999'));
  });

  it('refuses to remove the last remaining authorized user', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ users: { data: [{ telegram_id: 999 }], error: null } }),
      api: { sendMessage },
      telegramId: 999,
      update: { message: { text: '/removeuser 999' } },
      session: null,
    };

    await handleRemoveUser(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(999, expect.stringContaining('last remaining'));
  });
});

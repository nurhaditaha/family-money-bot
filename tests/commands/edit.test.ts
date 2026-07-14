import { describe, it, expect, vi } from 'vitest';
import { handleEdit, continueEdit } from '../../src/commands/edit';
import { createMockDb } from '../helpers/mockDb';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    db: createMockDb({ gifts: { data: null, error: null } }),
    api: { sendMessage: vi.fn() } as never,
    telegramId: 123,
    update: { message: { text: '/edit A7F2' } } as never,
    session: null,
    ...overrides,
  };
}

describe('handleEdit', () => {
  it('reports usage when no short ID is given', async () => {
    const ctx = makeCtx({ update: { message: { text: '/edit' } } });

    await handleEdit(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Usage')
    );
  });

  it('reports when the short ID does not exist', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({ gifts: { data: null, error: null } }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/edit ZZZZ' } },
      session: null,
    };

    await handleEdit(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('not found'));
  });

  it('shows the entry and asks which field to change when found', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({
        gifts: { data: { id: 'g1', short_id: 'A7F2', amount: 50, currency: 'SGD', banked: false }, error: null },
      }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/edit A7F2' } },
      session: null,
    };

    await handleEdit(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('A7F2'));
  });

  it('strips the @BotName suffix used in group-chat command syntax', async () => {
    const sendMessage = vi.fn();
    const ctx = {
      db: createMockDb({
        gifts: { data: { id: 'g1', short_id: 'A7F2', amount: 50, currency: 'SGD', banked: false }, error: null },
      }),
      api: { sendMessage },
      telegramId: 123,
      update: { message: { text: '/edit@SomeBotName A7F2' } },
      session: null,
    };

    await handleEdit(ctx as never);

    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('A7F2'));
  });
});

describe('continueEdit', () => {
  it('does nothing when there is no active session', async () => {
    const ctx = makeCtx({ session: null, update: { message: { text: 'amount' } } });

    await continueEdit(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).not.toHaveBeenCalled();
  });

  describe('step "field"', () => {
    it('advances to "newValue" when a valid field name is given', async () => {
      const sendMessage = vi.fn();
      const ctx = {
        db: createMockDb({ gifts: { data: null, error: null } }),
        api: { sendMessage },
        telegramId: 123,
        update: { message: { text: 'amount' } },
        session: { command: 'edit', step: 'field', data: { giftId: 'g1', shortId: 'A7F2' } },
      };

      await continueEdit(ctx as never);

      expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('amount'));
    });

    it('re-prompts without advancing when given an invalid field name', async () => {
      const sendMessage = vi.fn();
      const ctx = {
        db: createMockDb({ gifts: { data: null, error: null } }),
        api: { sendMessage },
        telegramId: 123,
        update: { message: { text: 'color' } },
        session: { command: 'edit', step: 'field', data: { giftId: 'g1', shortId: 'A7F2' } },
      };

      await continueEdit(ctx as never);

      expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Pick one of'));
    });
  });

  describe('step "newValue"', () => {
    it('updates the chosen field and confirms', async () => {
      const sendMessage = vi.fn();
      const db = createMockDb({ gifts: { data: null, error: null } });
      const ctx = {
        db,
        api: { sendMessage },
        telegramId: 123,
        update: { message: { text: '75' } },
        session: { command: 'edit', step: 'newValue', data: { giftId: 'g1', shortId: 'A7F2', field: 'amount' } },
      };

      await continueEdit(ctx as never);

      expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('Updated'));
    });

    it('rejects a non-numeric amount without updating and re-prompts', async () => {
      const sendMessage = vi.fn();
      const db = createMockDb({ gifts: { data: null, error: null } });
      const fromSpy = db.from as unknown as ReturnType<typeof vi.fn>;
      const ctx = {
        db,
        api: { sendMessage },
        telegramId: 123,
        update: { message: { text: 'not-a-number' } },
        session: { command: 'edit', step: 'newValue', data: { giftId: 'g1', shortId: 'A7F2', field: 'amount' } },
      };

      await continueEdit(ctx as never);

      expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('number'));
      expect(sendMessage).not.toHaveBeenCalledWith(123, expect.stringContaining('Updated'));
      expect(fromSpy).not.toHaveBeenCalledWith('gifts');
    });

    it('parses "yes" as true for the banked field', async () => {
      const sendMessage = vi.fn();
      const db = createMockDb({ gifts: { data: null, error: null } });
      const ctx = {
        db,
        api: { sendMessage },
        telegramId: 123,
        update: { message: { text: 'yes' } },
        session: { command: 'edit', step: 'newValue', data: { giftId: 'g1', shortId: 'A7F2', field: 'banked' } },
      };

      await continueEdit(ctx as never);

      expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('true'));
    });

    it('parses "no" as false for the banked field', async () => {
      const sendMessage = vi.fn();
      const db = createMockDb({ gifts: { data: null, error: null } });
      const ctx = {
        db,
        api: { sendMessage },
        telegramId: 123,
        update: { message: { text: 'no' } },
        session: { command: 'edit', step: 'newValue', data: { giftId: 'g1', shortId: 'A7F2', field: 'banked' } },
      };

      await continueEdit(ctx as never);

      expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('false'));
    });
  });
});

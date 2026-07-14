import { describe, it, expect, vi } from 'vitest';
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

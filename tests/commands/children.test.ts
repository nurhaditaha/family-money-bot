import { describe, it, expect, vi } from 'vitest';
import { handleAddChild, handleRenameChild, continueRenameChild } from '../../src/commands/children';
import { createMockDb } from '../helpers/mockDb';

function makeCtx(overrides: Record<string, unknown> = {}) {
  return {
    db: createMockDb({ children: { data: [{ id: 'c1', name: 'Baby #3' }], error: null } }),
    api: { sendMessage: vi.fn() } as never,
    telegramId: 123,
    update: { message: { text: '/addchild' } } as never,
    session: null,
    ...overrides,
  };
}

describe('handleAddChild', () => {
  it('rejects when no name is given', async () => {
    const ctx = makeCtx({ update: { message: { text: '/addchild' } } });

    await handleAddChild(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Usage')
    );
  });

  it('rejects when name is only whitespace', async () => {
    const ctx = makeCtx({ update: { message: { text: '/addchild    ' } } });

    await handleAddChild(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Usage')
    );
  });

  it('adds the child and confirms', async () => {
    const ctx = makeCtx({
      db: createMockDb({ children: { data: null, error: null } }),
      update: { message: { text: '/addchild Baby #3' } },
    });

    await handleAddChild(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Baby #3')
    );
  });
});

describe('handleRenameChild', () => {
  it('lists children and waits for a selection', async () => {
    const ctx = makeCtx({ update: {} });

    await handleRenameChild(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Baby #3')
    );
  });
});

describe('continueRenameChild', () => {
  it('advances from "pick" to "newName" when a valid child name is given', async () => {
    const ctx = makeCtx({
      session: { command: 'renamechild', step: 'pick', data: {} },
      update: { message: { text: 'Baby #3' } },
    });

    await continueRenameChild(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Baby #3')
    );
  });

  it('re-prompts without advancing when the picked child name is not found', async () => {
    const ctx = makeCtx({
      session: { command: 'renamechild', step: 'pick', data: {} },
      update: { message: { text: 'Nobody' } },
    });

    await continueRenameChild(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining("don't recognize")
    );
  });

  it('renames on the second step ("newName") and confirms', async () => {
    const ctx = makeCtx({
      session: { command: 'renamechild', step: 'newName', data: { childId: 'c1', childName: 'Baby #3' } },
      update: { message: { text: 'Zara' } },
    });

    await continueRenameChild(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).toHaveBeenCalledWith(
      123,
      expect.stringContaining('Zara')
    );
  });

  it('does nothing when there is no active session', async () => {
    const ctx = makeCtx({ session: null, update: { message: { text: 'Zara' } } });

    await continueRenameChild(ctx as never);

    expect((ctx.api as { sendMessage: ReturnType<typeof vi.fn> }).sendMessage).not.toHaveBeenCalled();
  });
});

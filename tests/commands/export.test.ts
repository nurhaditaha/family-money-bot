import { describe, it, expect, vi } from 'vitest';
import { handleExport } from '../../src/commands/export';
import { createMockDb } from '../helpers/mockDb';

function makeCtx(overrides: { text?: string; gifts?: { data: unknown; error: unknown } }) {
  const sendDocument = vi.fn();
  const sendMessage = vi.fn();
  const ctx = {
    db: createMockDb({
      gifts: overrides.gifts ?? {
        data: [
          {
            short_id: 'A7F2',
            amount: 50,
            currency: 'SGD',
            giver: 'Aunty',
            occasion: 'Raya',
            note: null,
            banked: false,
            date: '2026-04-10',
            children: { name: 'Aisyah' },
          },
        ],
        error: null,
      },
    }),
    api: { sendDocument, sendMessage },
    telegramId: 123,
    update: { message: { text: overrides.text ?? '/export' } },
    session: null,
  };
  return { ctx, sendDocument, sendMessage };
}

describe('handleExport', () => {
  it('sends a CSV document with a header and one row per gift', async () => {
    const { ctx, sendDocument } = makeCtx({});

    await handleExport(ctx as never);

    expect(sendDocument).toHaveBeenCalledTimes(1);
    const [chatId, filename, content] = sendDocument.mock.calls[0]!;
    expect(chatId).toBe(123);
    expect(filename).toContain('.csv');
    expect(typeof content).toBe('string');

    const lines = (content as string).split('\n');
    expect(lines[0]).toBe('short_id,childName,amount,currency,giver,occasion,note,banked,date');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('A7F2');
    expect(lines[1]).toContain('Aisyah');
  });

  it('names the file with the year when a valid year is given', async () => {
    const { ctx, sendDocument } = makeCtx({ text: '/export 2026' });

    await handleExport(ctx as never);

    const [, filename] = sendDocument.mock.calls[0]!;
    expect(filename).toBe('duit-raya-2026.csv');
  });

  it('uses a generic filename with no year argument', async () => {
    const { ctx, sendDocument } = makeCtx({ text: '/export' });

    await handleExport(ctx as never);

    const [, filename] = sendDocument.mock.calls[0]!;
    expect(filename).toBe('duit-raya-all.csv');
  });

  it('rejects a non-numeric year argument instead of silently exporting everything', async () => {
    const { ctx, sendDocument, sendMessage } = makeCtx({ text: '/export banana' });

    await handleExport(ctx as never);

    expect(sendDocument).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(123, expect.stringContaining('/export'));
  });
});

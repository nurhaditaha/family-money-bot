import { describe, it, expect, vi } from 'vitest';
import { createTelegramApi } from '../../src/telegram/api';

describe('createTelegramApi', () => {
  it('sendMessage posts to the correct URL with the correct body', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const api = createTelegramApi('TEST_TOKEN', fetchMock as unknown as typeof fetch);

    await api.sendMessage(123, 'hello');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botTEST_TOKEN/sendMessage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ chat_id: 123, text: 'hello', reply_markup: undefined, parse_mode: 'HTML' }),
      })
    );
  });

  it('sendMessage throws on a non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 400 });
    const api = createTelegramApi('TEST_TOKEN', fetchMock as unknown as typeof fetch);

    await expect(api.sendMessage(123, 'hello')).rejects.toThrow('Telegram sendMessage failed: 400');
  });

  it('answerCallbackQuery posts the callback query id', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
    const api = createTelegramApi('TEST_TOKEN', fetchMock as unknown as typeof fetch);

    await api.answerCallbackQuery('cbq-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.telegram.org/botTEST_TOKEN/answerCallbackQuery',
      expect.objectContaining({ body: JSON.stringify({ callback_query_id: 'cbq-1' }) })
    );
  });
});

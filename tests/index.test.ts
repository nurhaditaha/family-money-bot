import { describe, it, expect, vi, beforeEach } from 'vitest';

const { sendMessageMock, isAuthorizedMock, getSessionMock } = vi.hoisted(() => ({
  sendMessageMock: vi.fn(),
  isAuthorizedMock: vi.fn(),
  getSessionMock: vi.fn(),
}));

vi.mock('../src/telegram/api', () => ({
  createTelegramApi: () => ({ sendMessage: sendMessageMock, answerCallbackQuery: vi.fn(), sendDocument: vi.fn() }),
}));

vi.mock('../src/auth', () => ({ isAuthorized: isAuthorizedMock }));

vi.mock('../src/db/sessions', () => ({ getSession: getSessionMock, setSession: vi.fn(), clearSession: vi.fn() }));

vi.mock('../src/db/client', () => ({ createDb: () => ({}) }));

import worker from '../src/index';

const env = { TELEGRAM_BOT_TOKEN: 't', SUPABASE_URL: 'u', SUPABASE_SERVICE_KEY: 'k' };

function makeRequest(body: unknown) {
  return new Request('https://example.com/webhook', { method: 'POST', body: JSON.stringify(body) });
}

describe('worker webhook', () => {
  beforeEach(() => {
    sendMessageMock.mockClear();
    isAuthorizedMock.mockReset();
    getSessionMock.mockReset();
  });

  it('rejects unauthorized senders with their Telegram ID', async () => {
    isAuthorizedMock.mockResolvedValue(false);
    getSessionMock.mockResolvedValue(null);

    await worker.fetch(
      makeRequest({ update_id: 1, message: { message_id: 1, from: { id: 999, first_name: 'X' }, chat: { id: 999 }, text: '/help' } }),
      env as never
    );

    expect(sendMessageMock).toHaveBeenCalledWith(999, expect.stringContaining('999'));
  });

  it('routes /help to the help handler for an authorized sender', async () => {
    isAuthorizedMock.mockResolvedValue(true);
    getSessionMock.mockResolvedValue(null);

    await worker.fetch(
      makeRequest({ update_id: 2, message: { message_id: 2, from: { id: 123, first_name: 'X' }, chat: { id: 123 }, text: '/help' } }),
      env as never
    );

    expect(sendMessageMock).toHaveBeenCalledWith(123, expect.stringContaining('/log'));
  });
});

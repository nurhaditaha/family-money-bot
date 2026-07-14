export function createTelegramApi(token: string, fetchImpl: typeof fetch = fetch) {
  const base = `https://api.telegram.org/bot${token}`;

  async function post(method: string, body: unknown) {
    const res = await fetchImpl(`${base}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Telegram ${method} failed: ${res.status}`);
    return res.json();
  }

  return {
    async sendMessage(chatId: number, text: string, replyMarkup?: unknown) {
      return post('sendMessage', { chat_id: chatId, text, reply_markup: replyMarkup, parse_mode: 'HTML' });
    },
    async answerCallbackQuery(callbackQueryId: string) {
      return post('answerCallbackQuery', { callback_query_id: callbackQueryId });
    },
    async sendDocument(chatId: number, filename: string, content: string) {
      const form = new FormData();
      form.append('chat_id', String(chatId));
      form.append('document', new Blob([content], { type: 'text/csv' }), filename);
      const res = await fetchImpl(`${base}/sendDocument`, { method: 'POST', body: form });
      if (!res.ok) throw new Error(`Telegram sendDocument failed: ${res.status}`);
      return res.json();
    },
  };
}

export type TelegramApi = ReturnType<typeof createTelegramApi>;

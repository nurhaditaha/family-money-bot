import { createDb } from './db/client';
import { createTelegramApi } from './telegram/api';
import { isAuthorized } from './auth';
import { getSession } from './db/sessions';
import type { TelegramUpdate } from './telegram/types';
import type { Ctx, CommandHandler } from './commands/types';
import { handleHelp } from './commands/help';

export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
}

// Later tasks add entries here (e.g. '/log': handleLog) — nothing else in
// this file needs to change when a new top-level command is added.
const commands: Record<string, CommandHandler> = {
  '/help': handleHelp,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return new Response('OK');

    const update = (await request.json()) as TelegramUpdate;
    const db = createDb(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
    const api = createTelegramApi(env.TELEGRAM_BOT_TOKEN);

    const telegramId = update.message?.from.id ?? update.callback_query?.from.id;
    if (!telegramId) return new Response('OK');

    try {
      if (!(await isAuthorized(db, telegramId))) {
        await api.sendMessage(
          telegramId,
          `You're not authorized yet. Your Telegram ID is ${telegramId} — ask an existing user to run /adduser ${telegramId} <your name>.`
        );
        return new Response('OK');
      }

      const session = await getSession(db, telegramId);
      const ctx: Ctx = { db, api, telegramId, update, session };
      const text = update.message?.text?.trim().split(' ')[0];

      if (text && commands[text]) {
        await commands[text](ctx);
      }
      // Session-continuation and callback-query routing are added in later tasks.
    } catch (err) {
      console.error('Unhandled error in webhook handler:', err);
      await api.sendMessage(telegramId, 'Something went wrong, try again.');
    }

    return new Response('OK');
  },
};

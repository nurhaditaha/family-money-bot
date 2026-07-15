import { createDb } from './db/client';
import { createTelegramApi } from './telegram/api';
import { isAuthorized } from './auth';
import { getSession } from './db/sessions';
import type { TelegramUpdate } from './telegram/types';
import type { Ctx, CommandHandler } from './commands/types';
import { handleHelp } from './commands/help';
import { handleLog, continueLog } from './commands/log';
import { handleAddChild, handleRenameChild, continueRenameChild } from './commands/children';
import { handleEdit, continueEdit } from './commands/edit';
import { handleBank, toggleBankSelection, confirmBank } from './commands/bank';
import { handleTotal, handleTotals } from './commands/totals';
import { handleUnbanked } from './commands/unbanked';
import { handleExport } from './commands/export';
import { handleAddUser, handleRemoveUser } from './commands/users';
import { handleSetDefaultCurrency } from './commands/settings';

export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  // Optional: set this if this bot shares a Supabase project with other
  // tools, each isolated in its own schema. Defaults to 'public'.
  SUPABASE_SCHEMA?: string;
}

// Later tasks add entries here — nothing else in this file needs to change
// when a new top-level command is added.
const commands: Record<string, CommandHandler> = {
  '/help': handleHelp,
  '/log': handleLog,
  '/addchild': handleAddChild,
  '/renamechild': handleRenameChild,
  '/edit': handleEdit,
  '/bank': handleBank,
  '/total': handleTotal,
  '/totals': handleTotals,
  '/unbanked': handleUnbanked,
  '/export': handleExport,
  '/adduser': handleAddUser,
  '/removeuser': handleRemoveUser,
  '/setdefaultcurrency': handleSetDefaultCurrency,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return new Response('OK');

    const update = (await request.json()) as TelegramUpdate;
    const db = createDb(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, env.SUPABASE_SCHEMA);
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
      // Group chats often suffix commands with @BotName (e.g. /edit@SomeBotName).
      // Strip that suffix from the command token before matching against the registry.
      const text = update.message?.text?.trim().split(' ')[0]?.replace(/@\w+$/, '');
      const callbackData = update.callback_query?.data;

      if (callbackData?.startsWith('bank:toggle:')) {
        await toggleBankSelection(ctx);
      } else if (callbackData === 'bank:confirm') {
        await confirmBank(ctx);
      } else if (text && commands[text]) {
        await commands[text](ctx);
      } else if (session?.command === 'log') {
        await continueLog(ctx);
      } else if (session?.command === 'renamechild') {
        await continueRenameChild(ctx);
      } else if (session?.command === 'edit') {
        await continueEdit(ctx);
      }
      // Additional session-continuation and callback-query routing are added in later tasks.
    } catch (err) {
      console.error('Unhandled error in webhook handler:', err);
      await api.sendMessage(telegramId, 'Something went wrong, try again.');
    }

    return new Response('OK');
  },
};

import type { SupabaseClient } from '@supabase/supabase-js';
import type { TelegramApi } from '../telegram/api';
import type { TelegramUpdate } from '../telegram/types';
import type { Session } from '../db/sessions';

export interface Ctx {
  db: SupabaseClient;
  api: TelegramApi;
  telegramId: number;
  update: TelegramUpdate;
  session: Session | null;
}

export type CommandHandler = (ctx: Ctx) => Promise<void>;

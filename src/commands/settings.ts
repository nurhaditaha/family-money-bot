import type { CommandHandler } from './types';
import { setDefaultCurrency } from '../db/settings';
import { isValidCurrencyCode, normalizeCurrencyCode } from '../lib/currency';

export const handleSetDefaultCurrency: CommandHandler = async (ctx) => {
  const text = ctx.update.message?.text ?? '';
  const code = text.replace(/^\/\w+(@\w+)?\s*/, '').trim();

  if (!isValidCurrencyCode(code)) {
    await ctx.api.sendMessage(ctx.telegramId, 'Currency should be a 3-letter code, e.g. SGD.');
    return;
  }

  const normalized = normalizeCurrencyCode(code);
  await setDefaultCurrency(ctx.db, normalized);
  await ctx.api.sendMessage(ctx.telegramId, `Default currency is now ${normalized}.`);
};

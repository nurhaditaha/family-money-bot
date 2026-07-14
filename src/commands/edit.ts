import type { Ctx, CommandHandler } from './types';
import { findGiftByShortId, updateGiftField, isEditableField, type EditableField } from '../db/giftLookup';
import { setSession, clearSession } from '../db/sessions';
import { isValidCurrencyCode, normalizeCurrencyCode } from '../lib/currency';

export const handleEdit: CommandHandler = async (ctx) => {
  const text = ctx.update.message?.text ?? '';
  const shortId = text.replace(/^\/\w+(@\w+)?\s*/, '').trim().toUpperCase();
  if (!shortId) {
    await ctx.api.sendMessage(ctx.telegramId, 'Usage: /edit <short_id>');
    return;
  }
  const gift = await findGiftByShortId(ctx.db, shortId);
  if (!gift) {
    await ctx.api.sendMessage(ctx.telegramId, `#${shortId} not found.`);
    return;
  }
  await setSession(ctx.db, ctx.telegramId, {
    command: 'edit',
    step: 'field',
    data: { giftId: gift.id, shortId: gift.short_id },
  });
  await ctx.api.sendMessage(
    ctx.telegramId,
    `#${gift.short_id}: ${gift.currency} ${gift.amount}, giver=${gift.giver ?? '-'}, occasion=${gift.occasion ?? '-'}, note=${gift.note ?? '-'}, banked=${gift.banked}\nWhich field to change? (amount/currency/giver/occasion/note/banked)`
  );
};

export async function continueEdit(ctx: Ctx): Promise<void> {
  const session = ctx.session;
  if (!session) return;
  const text = ctx.update.message?.text?.trim() ?? '';

  if (session.step === 'field') {
    if (!isEditableField(text.toLowerCase())) {
      await ctx.api.sendMessage(ctx.telegramId, 'Pick one of: amount, currency, giver, occasion, note, banked');
      return;
    }
    await setSession(ctx.db, ctx.telegramId, {
      command: 'edit',
      step: 'newValue',
      data: { ...session.data, field: text.toLowerCase() as EditableField },
    });
    await ctx.api.sendMessage(ctx.telegramId, `New value for ${text}?`);
    return;
  }

  if (session.step === 'newValue') {
    const field = session.data.field as EditableField;
    const giftId = session.data.giftId as string;
    const shortId = session.data.shortId as string;

    let value: unknown = text;
    if (field === 'amount') {
      const amount = Number(text);
      if (!Number.isFinite(amount) || amount <= 0) {
        await ctx.api.sendMessage(ctx.telegramId, `"${text}" didn't look like a number. New value for amount?`);
        return;
      }
      value = amount;
    }
    if (field === 'currency') {
      if (!isValidCurrencyCode(text)) {
        await ctx.api.sendMessage(
          ctx.telegramId,
          `Currency should be a 3-letter code, e.g. SGD. New value for currency?`
        );
        return;
      }
      value = normalizeCurrencyCode(text);
    }
    if (field === 'banked') value = text.toLowerCase().startsWith('y');

    await updateGiftField(ctx.db, giftId, field, value);
    await clearSession(ctx.db, ctx.telegramId);
    await ctx.api.sendMessage(ctx.telegramId, `Updated #${shortId}: ${field} = ${value}`);
  }
}

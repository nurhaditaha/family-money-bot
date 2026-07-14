import type { Ctx, CommandHandler } from './types';
import { listChildren } from '../db/children';
import { distinctOccasions, distinctCurrencies, insertGift } from '../db/gifts';
import { getDefaultCurrency } from '../db/settings';
import { setSession, clearSession } from '../db/sessions';
import { generateShortId } from '../lib/shortId';
import { isValidCurrencyCode, normalizeCurrencyCode } from '../lib/currency';

const STEPS = ['child', 'amount', 'currency', 'giver', 'occasion', 'note', 'banked'] as const;
type Step = (typeof STEPS)[number];

export const handleLog: CommandHandler = async (ctx) => {
  const children = await listChildren(ctx.db);
  const names = children.map((c) => c.name).join(', ');
  await setSession(ctx.db, ctx.telegramId, { command: 'log', step: 'child', data: {} });
  await ctx.api.sendMessage(ctx.telegramId, `Which child?\n${names}`);
};

export async function continueLog(ctx: Ctx): Promise<void> {
  const session = ctx.session;
  if (!session) return;
  const text = ctx.update.message?.text?.trim() ?? '';
  const data = { ...session.data } as Record<string, unknown>;
  const step = session.step as Step;

  switch (step) {
    case 'child': {
      const children = await listChildren(ctx.db);
      const match = children.find((c) => c.name.toLowerCase() === text.toLowerCase());
      if (!match) {
        await ctx.api.sendMessage(ctx.telegramId, `I don't recognize "${text}". Pick one of the listed names.`);
        return;
      }
      data.childId = match.id;
      data.childName = match.name;
      await advance(ctx, data, 'amount', 'How much?');
      return;
    }
    case 'amount': {
      const amount = Number(text);
      if (!Number.isFinite(amount) || amount <= 0) {
        await ctx.api.sendMessage(ctx.telegramId, `"${text}" didn't look like a number. How much?`);
        return;
      }
      data.amount = amount;
      const [defaultCurrency, currencies] = await Promise.all([getDefaultCurrency(ctx.db), distinctCurrencies(ctx.db)]);
      await advance(
        ctx,
        data,
        'currency',
        `Currency? (e.g. ${[defaultCurrency, ...currencies].filter((v, i, a) => a.indexOf(v) === i).join(', ')})`
      );
      return;
    }
    case 'currency': {
      if (!isValidCurrencyCode(text)) {
        await ctx.api.sendMessage(ctx.telegramId, `Currency should be a 3-letter code, e.g. SGD. Try again.`);
        return;
      }
      data.currency = normalizeCurrencyCode(text);
      await advance(ctx, data, 'giver', `Who gave it? (or type "skip")`);
      return;
    }
    case 'giver': {
      data.giver = text.toLowerCase() === 'skip' ? null : text;
      const occasions = await distinctOccasions(ctx.db);
      const suggestions = ['Raya', 'Birthday', 'CNY', ...occasions].filter((v, i, a) => a.indexOf(v) === i).join(', ');
      await advance(ctx, data, 'occasion', `Occasion? (${suggestions}, or type "skip")`);
      return;
    }
    case 'occasion': {
      data.occasion = text.toLowerCase() === 'skip' ? null : text;
      await advance(ctx, data, 'note', `Any notes? (or type "skip")`);
      return;
    }
    case 'note': {
      data.note = text.toLowerCase() === 'skip' ? null : text;
      await advance(ctx, data, 'banked', `Already banked? (Yes/No)`);
      return;
    }
    case 'banked': {
      const banked = text.toLowerCase().startsWith('y');
      const shortId = generateShortId();
      await insertGift(ctx.db, {
        shortId,
        childId: data.childId as string,
        amount: data.amount as number,
        currency: data.currency as string,
        giver: (data.giver as string | null) ?? null,
        occasion: (data.occasion as string | null) ?? null,
        note: (data.note as string | null) ?? null,
        banked,
        createdBy: String(ctx.telegramId),
      });
      await clearSession(ctx.db, ctx.telegramId);
      const parts = [
        `#${shortId}`,
        `${data.currency} ${data.amount}`,
        `for ${data.childName}`,
        data.giver ? `from ${data.giver}` : null,
        data.occasion ? `(${data.occasion})` : null,
        banked ? 'already banked' : 'not yet banked',
      ].filter(Boolean);
      await ctx.api.sendMessage(ctx.telegramId, `Logged ✅ ${parts.join(' ')}`);
      return;
    }
  }
}

async function advance(ctx: Ctx, data: Record<string, unknown>, step: Step, prompt: string) {
  await setSession(ctx.db, ctx.telegramId, { command: 'log', step, data });
  await ctx.api.sendMessage(ctx.telegramId, prompt);
}

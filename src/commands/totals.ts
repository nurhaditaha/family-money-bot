import type { CommandHandler } from './types';
import { listChildren } from '../db/children';
import { giftsForChild, totalsByChild } from '../db/gifts';
import { groupTotalsByCurrency, formatTotals } from '../lib/totals';

export const handleTotal: CommandHandler = async (ctx) => {
  const text = ctx.update.message?.text ?? '';
  const name = text.replace(/^\/\w+(@\w+)?\s*/, '').trim();
  if (!name) {
    await ctx.api.sendMessage(ctx.telegramId, 'Usage: /total <child name>');
    return;
  }
  const children = await listChildren(ctx.db);
  const match = children.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (!match) {
    await ctx.api.sendMessage(ctx.telegramId, `I don't recognize "${name}".`);
    return;
  }
  const gifts = await giftsForChild(ctx.db, match.id);
  const totals = groupTotalsByCurrency(gifts);
  await ctx.api.sendMessage(ctx.telegramId, `${match.name} — ${formatTotals(totals)}`);
};

export const handleTotals: CommandHandler = async (ctx) => {
  const rows = await totalsByChild(ctx.db);
  const byChild = new Map<string, { currency: string; amount: number }[]>();
  for (const row of rows) {
    byChild.set(row.childName, [...(byChild.get(row.childName) ?? []), { currency: row.currency, amount: row.amount }]);
  }
  const lines = Array.from(byChild.entries()).map(
    ([childName, gifts]) => `${childName} — ${formatTotals(groupTotalsByCurrency(gifts))}`
  );
  await ctx.api.sendMessage(ctx.telegramId, lines.length > 0 ? lines.join('\n') : 'No gifts logged yet.');
};

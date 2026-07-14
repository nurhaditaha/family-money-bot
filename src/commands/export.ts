import type { CommandHandler } from './types';
import { giftsForExport } from '../db/gifts';
import { toCsv } from '../lib/csv';

const COLUMNS = ['short_id', 'childName', 'amount', 'currency', 'giver', 'occasion', 'note', 'banked', 'date'];

export const handleExport: CommandHandler = async (ctx) => {
  const text = ctx.update.message?.text ?? '';
  const yearArg = text.replace(/^\/\w+(@\w+)?\s*/, '').trim();

  let year: number | undefined;
  if (yearArg) {
    // Reject anything that isn't a plain 4-digit year rather than silently
    // falling back to "export everything" — Number('banana') is NaN, and
    // NaN is falsy, so an unvalidated `year ? ... : undefined` check would
    // skip the date filter and quietly return the entire gift history
    // instead of telling the user their input was bad.
    if (!/^\d{4}$/.test(yearArg)) {
      await ctx.api.sendMessage(ctx.telegramId, `"${yearArg}" isn't a valid year. Usage: /export [YYYY]`);
      return;
    }
    year = Number(yearArg);
  }

  const rows = await giftsForExport(ctx.db, year);
  const csv = toCsv(COLUMNS, rows as unknown as Record<string, unknown>[]);
  const filename = year ? `duit-raya-${year}.csv` : 'duit-raya-all.csv';
  await ctx.api.sendDocument(ctx.telegramId, filename, csv);
};

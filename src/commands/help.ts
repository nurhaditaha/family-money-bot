import type { CommandHandler } from './types';

const HELP_TEXT = `Commands:
/log — log a new gift
/edit <short_id> — amend a past entry
/bank — mark multiple unbanked entries as banked
/totals — running totals for all kids
/total <child> — running total for one kid
/unbanked — list entries not yet banked
/export [year] — download a CSV
/addchild <name> — add a child
/renamechild — rename a child
/adduser <telegram_id> <name> — authorize someone
/removeuser <telegram_id> — revoke access
/setdefaultcurrency <CODE> — change the default currency
/help — this message`;

export const handleHelp: CommandHandler = async (ctx) => {
  await ctx.api.sendMessage(ctx.telegramId, HELP_TEXT);
};

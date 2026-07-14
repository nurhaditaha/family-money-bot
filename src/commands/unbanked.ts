import type { CommandHandler } from './types';
import { listUnbanked } from '../db/gifts';

export const handleUnbanked: CommandHandler = async (ctx) => {
  const unbanked = await listUnbanked(ctx.db);
  if (unbanked.length === 0) {
    await ctx.api.sendMessage(ctx.telegramId, 'Everything is banked. 🎉');
    return;
  }
  const lines = unbanked.map((g) => `#${g.short_id} — ${g.childName} — ${g.currency} ${g.amount}`);
  await ctx.api.sendMessage(ctx.telegramId, `Not yet banked (${unbanked.length}):\n${lines.join('\n')}`);
};

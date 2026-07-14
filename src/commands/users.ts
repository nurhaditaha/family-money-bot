import type { CommandHandler } from './types';
import { addUser, removeUser, countUsers } from '../db/users';

export const handleAddUser: CommandHandler = async (ctx) => {
  const text = ctx.update.message?.text ?? '';
  const rest = text.replace(/^\/\w+(@\w+)?\s*/, '').trim();
  const [idPart, ...nameParts] = rest.split(/\s+/);
  const telegramId = Number(idPart);
  const name = nameParts.join(' ').trim();

  if (!idPart || !Number.isFinite(telegramId) || telegramId <= 0 || !name) {
    await ctx.api.sendMessage(ctx.telegramId, 'Usage: /adduser <telegram_id> <name>');
    return;
  }

  await addUser(ctx.db, telegramId, name);
  await ctx.api.sendMessage(ctx.telegramId, `Added ${name} (${telegramId}) as an authorized user.`);
};

export const handleRemoveUser: CommandHandler = async (ctx) => {
  const text = ctx.update.message?.text ?? '';
  const rest = text.replace(/^\/\w+(@\w+)?\s*/, '').trim();
  const telegramId = Number(rest);

  if (!rest || !Number.isFinite(telegramId) || telegramId <= 0) {
    await ctx.api.sendMessage(ctx.telegramId, 'Usage: /removeuser <telegram_id>');
    return;
  }

  // Refuse to remove the last remaining authorized user. Without this guard,
  // the bot could end up with zero authorized users and no way back in —
  // an unauthorized sender is only ever told to ask an existing user
  // (see the auth flow), which is impossible if nobody is left.
  const remaining = await countUsers(ctx.db);
  if (remaining <= 1) {
    await ctx.api.sendMessage(
      ctx.telegramId,
      "Can't remove the last remaining authorized user — that would lock everyone out."
    );
    return;
  }

  await removeUser(ctx.db, telegramId);
  await ctx.api.sendMessage(ctx.telegramId, `Removed access for ${telegramId}.`);
};

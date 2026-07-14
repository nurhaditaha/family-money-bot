import type { Ctx, CommandHandler } from './types';
import { listChildren, addChild, renameChild } from '../db/children';
import { setSession, clearSession } from '../db/sessions';

export const handleAddChild: CommandHandler = async (ctx) => {
  const text = ctx.update.message?.text ?? '';
  const name = text.replace(/^\/\w+(@\w+)?\s*/, '').trim();
  if (!name) {
    await ctx.api.sendMessage(ctx.telegramId, 'Usage: /addchild <name>');
    return;
  }
  await addChild(ctx.db, name);
  await ctx.api.sendMessage(ctx.telegramId, `Added child: ${name}`);
};

export const handleRenameChild: CommandHandler = async (ctx) => {
  const children = await listChildren(ctx.db);
  const names = children.map((c) => c.name).join(', ');
  await setSession(ctx.db, ctx.telegramId, { command: 'renamechild', step: 'pick', data: {} });
  await ctx.api.sendMessage(ctx.telegramId, `Rename which child?\n${names}`);
};

export async function continueRenameChild(ctx: Ctx): Promise<void> {
  const session = ctx.session;
  if (!session) return;
  const text = ctx.update.message?.text?.trim() ?? '';

  if (session.step === 'pick') {
    const children = await listChildren(ctx.db);
    const match = children.find((c) => c.name.toLowerCase() === text.toLowerCase());
    if (!match) {
      await ctx.api.sendMessage(ctx.telegramId, `I don't recognize "${text}". Pick one of the listed names.`);
      return;
    }
    await setSession(ctx.db, ctx.telegramId, {
      command: 'renamechild',
      step: 'newName',
      data: { childId: match.id, childName: match.name },
    });
    await ctx.api.sendMessage(ctx.telegramId, `New name for ${match.name}?`);
    return;
  }

  if (session.step === 'newName') {
    const childId = session.data.childId as string;
    await renameChild(ctx.db, childId, text);
    await clearSession(ctx.db, ctx.telegramId);
    await ctx.api.sendMessage(ctx.telegramId, `Renamed to ${text}. Past entries now show the new name too.`);
  }
}

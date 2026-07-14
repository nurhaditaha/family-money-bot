import type { Ctx, CommandHandler } from './types';
import { listUnbanked, markBanked } from '../db/gifts';
import { setSession, clearSession } from '../db/sessions';
import { groupTotalsByCurrency, formatTotals } from '../lib/totals';

// NOTE: the "Confirm (N selected)" button label is static — it always reads
// "Confirm (0 selected)" regardless of how many entries the user has tapped.
// Live-updating it on every toggle would require Telegram's
// editMessageReplyMarkup API, which the TelegramApi wrapper (src/telegram/api.ts)
// does not implement, and adding it is out of scope for this task. This is a
// known, accepted UI limitation: selections are still tracked correctly server-side
// (see toggleBankSelection), the button caption just won't visually reflect the
// running count until a future task adds editMessageReplyMarkup support.
export const handleBank: CommandHandler = async (ctx) => {
  const unbanked = await listUnbanked(ctx.db);
  if (unbanked.length === 0) {
    await ctx.api.sendMessage(ctx.telegramId, 'Nothing to bank — everything is already banked.');
    return;
  }
  await setSession(ctx.db, ctx.telegramId, {
    command: 'bank',
    step: 'select',
    data: { selected: [], entries: unbanked },
  });
  const label = (g: (typeof unbanked)[number]) => `#${g.short_id} — ${g.childName} — ${g.currency} ${g.amount}`;
  const keyboard = {
    inline_keyboard: [
      ...unbanked.map((g) => [{ text: label(g), callback_data: `bank:toggle:${g.id}` }]),
      [{ text: 'Confirm (0 selected)', callback_data: 'bank:confirm' }],
    ],
  };
  const list = unbanked.map(label).join('\n');
  await ctx.api.sendMessage(ctx.telegramId, `Which of these have you deposited?\n\n${list}`, keyboard);
};

// NOTE: this is a read-modify-write against the session row (read selected,
// mutate, write back). Two genuinely simultaneous taps (not sequential —
// actual concurrent requests) could race and one toggle could be lost. This
// is an accepted known limitation given the bot's sequential-tap usage
// pattern; the /bank confirmation step below re-verifies against the live
// unbanked list regardless, so a lost toggle can't cause double-counting.
export async function toggleBankSelection(ctx: Ctx): Promise<void> {
  const cbq = ctx.update.callback_query;
  const session = ctx.session;
  if (!cbq || !session || session.command !== 'bank') return;
  const giftId = cbq.data.split(':')[2];
  if (!giftId) return;
  const selected = new Set(session.data.selected as string[]);
  if (selected.has(giftId)) {
    selected.delete(giftId);
  } else {
    selected.add(giftId);
  }
  await setSession(ctx.db, ctx.telegramId, { ...session, data: { ...session.data, selected: Array.from(selected) } });
  await ctx.api.answerCallbackQuery(cbq.id);
}

export async function confirmBank(ctx: Ctx): Promise<void> {
  const cbq = ctx.update.callback_query;
  const session = ctx.session;
  if (!cbq || !session || session.command !== 'bank') return;
  const selected = session.data.selected as string[];
  const entries = session.data.entries as { id: string; currency: string; amount: number }[];
  if (selected.length === 0) {
    // Give explicit feedback rather than silently acknowledging the tap —
    // otherwise the user has no idea why nothing happened.
    await ctx.api.answerCallbackQuery(cbq.id, 'Select at least one entry first.');
    return;
  }

  // Re-check against the live unbanked list before committing. Another user may
  // have already confirmed some of these same IDs (e.g. two spouses both have
  // /bank open at once) — markBanked() itself is idempotent, but without this
  // re-check the confirmation total would double-count money someone else
  // already banked.
  const stillUnbanked = new Set((await listUnbanked(ctx.db)).map((g) => g.id));
  const staleCount = selected.filter((id) => !stillUnbanked.has(id)).length;
  const toBank = selected.filter((id) => stillUnbanked.has(id));

  if (toBank.length === 0) {
    await clearSession(ctx.db, ctx.telegramId);
    await ctx.api.answerCallbackQuery(cbq.id);
    await ctx.api.sendMessage(
      ctx.telegramId,
      'All of your selected entries were already banked by someone else — nothing to do.'
    );
    return;
  }

  await markBanked(ctx.db, toBank);
  const chosen = entries.filter((e) => toBank.includes(e.id));
  const totals = groupTotalsByCurrency(chosen);
  await clearSession(ctx.db, ctx.telegramId);
  await ctx.api.answerCallbackQuery(cbq.id);
  const staleNote = staleCount > 0 ? ` (${staleCount} of ${selected.length} selected were already banked by someone else)` : '';
  await ctx.api.sendMessage(
    ctx.telegramId,
    `Banked ✅ ${toBank.length} entries — total ${formatTotals(totals)} deposited${staleNote}`
  );
}

# Duit Raya Tracker

A Telegram bot for tracking money gifts given to your kids, year-round, across any occasion.

## Setup

1. Create a free [Supabase](https://supabase.com) project.
2. In the Supabase dashboard, go to SQL Editor, paste the contents of `migrations/001_init.sql`, and run it.
3. Seed your first authorized user and at least one child directly in the SQL Editor:

   ```sql
   insert into users (telegram_id, name) values (YOUR_TELEGRAM_ID, 'Your Name');
   insert into children (name) values ('Your Child');
   ```

   (Message [@userinfobot](https://t.me/userinfobot) on Telegram to find your Telegram ID.)
4. Create a Telegram bot via [@BotFather](https://t.me/BotFather), save the token it gives you.
5. Copy `.env.example` to `.env` and fill in your values.
6. Install dependencies: `npm install`
7. Run tests: `npm test`
8. Set secrets and deploy (see Deployment section below).

## Deployment

1. Log in to Cloudflare: `npx wrangler login`
2. Set the three secrets (you'll be prompted to paste each value):
   ```
   npx wrangler secret put TELEGRAM_BOT_TOKEN
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_KEY
   ```
3. Deploy: `npm run deploy` — this prints your Worker's URL.
4. Tell Telegram to send updates to that URL:
   ```
   curl "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook?url=<YOUR_WORKER_URL>"
   ```
5. Message your bot on Telegram with `/help` — you should get a reply.

## Commands

See `/help` in the bot itself for the full, current list.

## License

MIT — see `LICENSE`.

## Manual Verification Checklist

After deploying (see above), verify the bot works end-to-end:

1. Send `/help` — confirm the command list comes back.
2. Send `/log`, walk through the full flow (child, amount, currency, giver, occasion, note, banked), confirm the `Logged ✅ #XXXX` message.
3. Send `/unbanked` — confirm the entry from step 2 appears.
4. Send `/bank`, tap the entry's button, tap Confirm — confirm the "Banked ✅" message and that a repeat `/unbanked` no longer shows it.
5. Send `/edit <short_id>` from step 2, change the amount — confirm the "Updated" message.
6. Send `/totals` — confirm the child's total reflects the edited amount.
7. Send `/export` — confirm a `.csv` file arrives and opens correctly.
8. Send `/adduser <a second Telegram account's ID> <name>`, then have that account message the bot — confirm it's treated as authorized.
9. Message the bot from a third, unauthorized Telegram account — confirm it gets the "not authorized, here's your ID" reply rather than being silently ignored.

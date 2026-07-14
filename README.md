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
7. Set secrets and deploy (see Deployment section below).

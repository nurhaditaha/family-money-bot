create extension if not exists "pgcrypto";

create table users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint unique not null,
  name text not null,
  added_at timestamptz not null default now()
);

create table children (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table gifts (
  id uuid primary key default gen_random_uuid(),
  short_id text unique not null,
  child_id uuid not null references children(id),
  amount numeric not null,
  currency text not null,
  giver text,
  occasion text,
  date date not null default current_date,
  note text,
  banked boolean not null default false,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value text not null
);
insert into settings (key, value) values ('default_currency', 'SGD');

-- Holds in-progress guided-conversation state (/log, /edit, /bank) between
-- Telegram messages, since the Worker itself is stateless per request.
create table sessions (
  telegram_id bigint primary key,
  command text not null,
  step text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

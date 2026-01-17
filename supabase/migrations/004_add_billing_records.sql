create table if not exists public.billing_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_event_id text not null,
  event_type text,
  status text,
  customer_id text,
  order_id text,
  subscription_id text,
  transaction_id text,
  amount integer,
  currency text,
  created_at timestamptz default now(),
  raw_event jsonb
);

create unique index if not exists billing_records_source_event_id_key
  on public.billing_records(source_event_id);

create index if not exists billing_records_user_created_idx
  on public.billing_records(user_id, created_at desc);

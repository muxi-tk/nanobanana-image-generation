create table if not exists public.credit_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null check (source in ('subscription', 'credit-pack')),
  plan_id text,
  cycle text,
  credits_total integer not null,
  credits_remaining integer not null,
  expires_at timestamptz,
  source_event_id text,
  created_at timestamptz not null default now()
);

create unique index if not exists credit_grants_source_event_id_key
  on public.credit_grants(source_event_id);

create index if not exists credit_grants_user_id_idx
  on public.credit_grants(user_id);

create index if not exists credit_grants_user_expires_idx
  on public.credit_grants(user_id, expires_at);

alter table public.credit_grants enable row level security;

create policy "select own credit grants"
on public.credit_grants
for select
using (auth.uid() = user_id);

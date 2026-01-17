create table if not exists public.share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  history_id uuid references public.image_history(id) on delete set null,
  image_url text not null,
  created_at timestamptz not null default now()
);

alter table public.share_links enable row level security;

create policy "insert own share links"
on public.share_links
for insert
with check (auth.uid() = user_id);

create policy "select own share links"
on public.share_links
for select
using (auth.uid() = user_id);

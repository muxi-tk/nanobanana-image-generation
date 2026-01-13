create table if not exists public.image_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  prompt text,
  image_urls jsonb not null default '[]'::jsonb,
  model text,
  aspect_ratio text,
  resolution text,
  output_format text,
  generation_mode text
);

alter table public.image_history enable row level security;

create policy "select own history"
on public.image_history
for select
using (auth.uid() = user_id);

create policy "insert own history"
on public.image_history
for insert
with check (auth.uid() = user_id);

alter table public.image_history
  add column if not exists credits_per_image integer,
  add column if not exists credits_total integer,
  add column if not exists image_count integer default 1;

alter table public.billing_records
  add column if not exists expires_at timestamptz;

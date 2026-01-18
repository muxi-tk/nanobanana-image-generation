alter table public.billing_records enable row level security;

create policy "select own billing records"
on public.billing_records
for select
using (auth.uid() = user_id);

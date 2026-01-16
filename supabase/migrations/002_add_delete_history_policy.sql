create policy "delete own history"
on public.image_history
for delete
using (auth.uid() = user_id);

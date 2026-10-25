-- Theresia: announcement popup only. Personal backgrounds stay in each browser's localStorage.
-- Run in Supabase SQL Editor after the existing schema/security migrations.
insert into public.site_settings (key, value) values
  ('site_notice', '""'::jsonb)
on conflict (key) do nothing;

alter table public.site_settings enable row level security;
drop policy if exists "site settings readable" on public.site_settings;
create policy "site settings readable" on public.site_settings for select to anon, authenticated using (true);

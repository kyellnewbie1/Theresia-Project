-- Theresia community features: user search, public profiles, follow/unfollow.
-- Run after schema.sql and security-update.sql in Supabase SQL Editor.
create index if not exists profiles_username_search_idx on public.profiles using btree (username);
create index if not exists profiles_display_name_search_idx on public.profiles using btree (display_name);
create index if not exists follows_followed_id_idx on public.follows (followed_id);
create index if not exists follows_follower_id_idx on public.follows (follower_id);

alter table public.follows enable row level security;
drop policy if exists "follows visible" on public.follows;
create policy "follows visible" on public.follows for select to anon, authenticated using (true);
drop policy if exists "users follow as self" on public.follows;
create policy "users follow as self" on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()) and follower_id <> followed_id);
drop policy if exists "users unfollow as self" on public.follows;
create policy "users unfollow as self" on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));

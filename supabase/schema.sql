-- Theresia Project initial schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9_-]{3,30}$'),
  display_name text,
  bio text check (char_length(coalesce(bio,'')) <= 500),
  avatar_url text,
  role_label text not null default 'user',
  is_verified boolean not null default false,
  is_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100),
  description text check (char_length(coalesce(description,'')) <= 1000),
  file_name text not null,
  file_path text not null unique,
  file_size bigint not null check (file_size > 0 and file_size <= 20971520),
  file_type text not null default 'file',
  visibility text not null default 'public' check (visibility in ('public','private','password')),
  created_at timestamptz not null default now()
);
create index if not exists files_visibility_created_idx on public.files(visibility, created_at desc);
create index if not exists files_owner_created_idx on public.files(owner_id, created_at desc);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followed_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

create table if not exists public.role_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  requested_role text not null,
  reason text check (char_length(coalesce(reason,'')) <= 1000),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  review_reason text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- New accounts receive a profile and the default user label.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare base_name text; final_name text;
begin
  base_name := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'preferred_username', split_part(coalesce(new.email,'creator'), '@', 1)), '[^a-zA-Z0-9_-]', '', 'g'));
  if length(base_name) < 3 then base_name := 'user' || substr(replace(new.id::text,'-',''),1,8); end if;
  final_name := left(base_name, 22) || '_' || substr(replace(new.id::text,'-',''),1,6);
  insert into public.profiles(id, username, display_name, avatar_url)
  values(new.id, final_name, nullif(new.raw_user_meta_data->>'full_name',''), nullif(new.raw_user_meta_data->>'avatar_url',''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.files enable row level security;
alter table public.follows enable row level security;
alter table public.role_requests enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

-- Profiles are public-readable; users can only update their own safe profile fields.
drop policy if exists "profiles are viewable" on public.profiles;
create policy "profiles are viewable" on public.profiles for select using (true);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id and is_owner = (select p.is_owner from public.profiles p where p.id = auth.uid()) and is_verified = (select p.is_verified from public.profiles p where p.id = auth.uid()) and role_label = (select p.role_label from public.profiles p where p.id = auth.uid()));

-- File metadata access follows visibility. Only owner may create/update/delete their metadata.
drop policy if exists "public files and own files readable" on public.files;
create policy "public files and own files readable" on public.files for select to anon, authenticated using (visibility = 'public' or owner_id = auth.uid());
drop policy if exists "users insert own files" on public.files;
create policy "users insert own files" on public.files for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists "users update own files" on public.files;
create policy "users update own files" on public.files for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists "users delete own files" on public.files;
create policy "users delete own files" on public.files for delete to authenticated using (owner_id = auth.uid());

-- Follow relationships are visible; only a signed-in user can follow/unfollow as themselves.
drop policy if exists "follows visible" on public.follows;
create policy "follows visible" on public.follows for select using (true);
drop policy if exists "users follow as self" on public.follows;
create policy "users follow as self" on public.follows for insert to authenticated with check (follower_id = auth.uid() and follower_id <> followed_id);
drop policy if exists "users unfollow as self" on public.follows;
create policy "users unfollow as self" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- Users can create/read their own role requests. Approval actions intentionally require trusted admin/server-side logic.
drop policy if exists "read own role requests" on public.role_requests;
create policy "read own role requests" on public.role_requests for select to authenticated using (user_id = auth.uid());
drop policy if exists "create own role requests" on public.role_requests;
create policy "create own role requests" on public.role_requests for insert to authenticated with check (user_id = auth.uid() and status = 'pending' and reviewed_by is null);

-- Public site settings can be read; browser clients cannot mutate settings or audit logs.
drop policy if exists "site settings readable" on public.site_settings;
create policy "site settings readable" on public.site_settings for select using (true);
drop policy if exists "audit logs owner readable" on public.audit_logs;
create policy "audit logs owner readable" on public.audit_logs for select to authenticated using (exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_owner=true));

-- Storage bucket: private bucket. Public metadata may be read via app policies, but file objects are accessed through signed URLs.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('user-files', 'user-files', false, 20971520, null)
on conflict (id) do update set public = false, file_size_limit = 20971520;
drop policy if exists "owners upload own objects" on storage.objects;
create policy "owners upload own objects" on storage.objects for insert to authenticated with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owners read own objects" on storage.objects;
create policy "owners read own objects" on storage.objects for select to authenticated using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owners update own objects" on storage.objects;
create policy "owners update own objects" on storage.objects for update to authenticated using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text) with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owners delete own objects" on storage.objects;
create policy "owners delete own objects" on storage.objects for delete to authenticated using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- OWNER SETUP: after your first GitHub login, run this with the actual auth user UUID from Supabase.
-- update public.profiles set is_owner = true, role_label = 'Owner' where id = 'YOUR-AUTH-USER-UUID';

-- Theresia Project security/session hardening migration.
-- Run this in Supabase SQL Editor AFTER the original schema.sql.

-- Avoid recursive profiles RLS policies and prevent users editing privileged columns.
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is not null and auth.uid() <> old.id then
    raise exception 'Cannot modify another profile';
  end if;
  if auth.uid() = old.id and (
    new.is_owner is distinct from old.is_owner or
    new.is_verified is distinct from old.is_verified or
    new.role_label is distinct from old.role_label
  ) then
    raise exception 'Privileged profile fields can only be changed by an authorized server action';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges_trigger on public.profiles;
create trigger protect_profile_privileges_trigger
before update on public.profiles
for each row execute function public.protect_profile_privileges();

-- Keep public settings readable; browser clients must not write settings.
alter table public.site_settings enable row level security;
drop policy if exists "site settings readable" on public.site_settings;
create policy "site settings readable" on public.site_settings for select using (true);

-- Audit log is visible to owner only; inserts/updates are performed by trusted server code.
alter table public.audit_logs enable row level security;
drop policy if exists "audit logs owner readable" on public.audit_logs;
create policy "audit logs owner readable" on public.audit_logs for select to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_owner = true));

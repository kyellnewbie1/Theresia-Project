-- Jalankan sekali di Supabase SQL Editor setelah schema.sql.
alter table public.files add column if not exists view_count bigint not null default 0 check (view_count >= 0);
alter table public.files add column if not exists download_count bigint not null default 0 check (download_count >= 0);

create or replace function public.increment_file_views(p_file_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.files set view_count = view_count + 1 where id = p_file_id and visibility = 'public';
$$;
create or replace function public.increment_file_downloads(p_file_id uuid)
returns void language sql security definer set search_path = '' as $$
  update public.files set download_count = download_count + 1 where id = p_file_id and visibility = 'public';
$$;
revoke all on function public.increment_file_views(uuid) from public, anon, authenticated;
revoke all on function public.increment_file_downloads(uuid) from public, anon, authenticated;
grant execute on function public.increment_file_views(uuid) to service_role;
grant execute on function public.increment_file_downloads(uuid) to service_role;

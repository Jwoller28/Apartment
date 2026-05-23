create extension if not exists pgcrypto;

create table if not exists public.furniture_items (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  x numeric not null,
  y numeric not null,
  rotation numeric not null default 0,
  width numeric not null,
  height numeric not null,
  created_by text,
  updated_at timestamptz not null default now()
);

create or replace function public.set_furniture_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists furniture_items_updated_at on public.furniture_items;

create trigger furniture_items_updated_at
before update on public.furniture_items
for each row
execute function public.set_furniture_updated_at();

alter table public.furniture_items enable row level security;

drop policy if exists "Private toy app can read furniture" on public.furniture_items;
drop policy if exists "Private toy app can add furniture" on public.furniture_items;
drop policy if exists "Private toy app can update furniture" on public.furniture_items;
drop policy if exists "Private toy app can delete furniture" on public.furniture_items;

create policy "Private toy app can read furniture"
on public.furniture_items
for select
to anon
using (true);

create policy "Private toy app can add furniture"
on public.furniture_items
for insert
to anon
with check (true);

create policy "Private toy app can update furniture"
on public.furniture_items
for update
to anon
using (true)
with check (true);

create policy "Private toy app can delete furniture"
on public.furniture_items
for delete
to anon
using (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'furniture_items'
  ) then
    alter publication supabase_realtime add table public.furniture_items;
  end if;
end;
$$;

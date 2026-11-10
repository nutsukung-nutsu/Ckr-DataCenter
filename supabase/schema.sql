-- BCN CKR IT Asset Registry: run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.it_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text not null unique,
  name text not null,
  category text not null default 'อื่น ๆ',
  brand text,
  serial_number text,
  location text,
  department text,
  assignee text,
  status text not null default 'ใช้งานปกติ' check (status in ('ใช้งานปกติ','รอซ่อม','ส่งซ่อม','ใกล้ครบอายุ','จำหน่ายแล้ว')),
  purchase_date date,
  price numeric(12,2) not null default 0 check (price >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists it_assets_status_idx on public.it_assets(status);
create index if not exists it_assets_category_idx on public.it_assets(category);
create index if not exists it_assets_created_at_idx on public.it_assets(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists it_assets_set_updated_at on public.it_assets;
create trigger it_assets_set_updated_at before update on public.it_assets
for each row execute function public.set_updated_at();

alter table public.it_assets enable row level security;
drop policy if exists "Authenticated users can read assets" on public.it_assets;
create policy "Authenticated users can read assets" on public.it_assets
for select to authenticated using (true);
drop policy if exists "Authenticated users can add assets" on public.it_assets;
create policy "Authenticated users can add assets" on public.it_assets
for insert to authenticated with check (true);
drop policy if exists "Authenticated users can update assets" on public.it_assets;
create policy "Authenticated users can update assets" on public.it_assets
for update to authenticated using (true) with check (true);
drop policy if exists "Authenticated users can delete assets" on public.it_assets;
create policy "Authenticated users can delete assets" on public.it_assets
for delete to authenticated using (true);

grant select, insert, update, delete on public.it_assets to authenticated;

-- Create staff accounts from Supabase Dashboard > Authentication > Users.
-- For production, replace the broad authenticated policies with role-based policies
-- and restrict deletes to designated asset administrators.

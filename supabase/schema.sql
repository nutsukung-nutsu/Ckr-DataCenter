-- BCN CKR IT Asset Registry: run this in Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.it_assets (
  id uuid primary key default gen_random_uuid(),
  asset_code text unique,
  name text,
  category text not null default 'อื่น ๆ',
  brand text,
  serial_number text,
  location text,
  building text,
  floor text,
  department text,
  assignee text,
  status text not null default 'พร้อมใช้งาน',
  received_date date,
  fiscal_year integer,
  purchase_date date,
  image_path text,
  price numeric(12,2) not null default 0 check (price >= 0),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Upgrade existing installations without removing existing asset data.
alter table public.it_assets add column if not exists building text;
alter table public.it_assets add column if not exists floor text;
alter table public.it_assets add column if not exists received_date date;
alter table public.it_assets add column if not exists fiscal_year integer;
alter table public.it_assets add column if not exists image_path text;
alter table public.it_assets alter column status drop default;
alter table public.it_assets drop constraint if exists it_assets_status_check;
alter table public.it_assets add constraint it_assets_status_check check (status in ('พร้อมใช้งาน','กำลังใช้งาน','เครื่องสำรอง','ซ่อมบำรุง','รอแทงจำหน่าย','แทงจำหน่าย','ใช้งานปกติ','รอซ่อม','ส่งซ่อม','ใกล้ครบอายุ','จำหน่ายแล้ว'));
alter table public.it_assets alter column status set default 'พร้อมใช้งาน';
update public.it_assets set received_date = purchase_date where received_date is null and purchase_date is not null;

create index if not exists it_assets_status_idx on public.it_assets(status);
create index if not exists it_assets_category_idx on public.it_assets(category);
create index if not exists it_assets_created_at_idx on public.it_assets(created_at desc);
create index if not exists it_assets_fiscal_year_idx on public.it_assets(fiscal_year);
create index if not exists it_assets_building_idx on public.it_assets(building);

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

-- Private equipment image bucket. Files are stored under a category folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('it-asset-images', 'it-asset-images', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Authenticated users can read asset images" on storage.objects;
create policy "Authenticated users can read asset images" on storage.objects
for select to authenticated using (bucket_id = 'it-asset-images');
drop policy if exists "Authenticated users can upload asset images" on storage.objects;
create policy "Authenticated users can upload asset images" on storage.objects
for insert to authenticated with check (bucket_id = 'it-asset-images' and public.has_access_role(array['super_admin','asset_manager']));
drop policy if exists "Authenticated users can delete asset images" on storage.objects;
create policy "Authenticated users can delete asset images" on storage.objects
for delete to authenticated using (bucket_id = 'it-asset-images' and public.has_access_role(array['super_admin','asset_manager']));

-- Create staff accounts from Supabase Dashboard > Authentication > Users.
-- For production, replace the broad authenticated policies with role-based policies
-- and restrict deletes to designated asset administrators.

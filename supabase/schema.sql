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
  status_option_type text not null default 'asset_statuses',
  received_date date,
  fiscal_year integer,
  purchase_date date,
  image_path text,
  image_paths text[] not null default '{}',
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
alter table public.it_assets add column if not exists image_paths text[] not null default '{}';
alter table public.it_assets alter column status drop default;
alter table public.it_assets drop constraint if exists it_assets_status_check;
alter table public.it_assets add column if not exists status_option_type text not null default 'asset_statuses';
alter table public.it_assets alter column status set default 'พร้อมใช้งาน';
update public.it_assets set received_date = purchase_date where received_date is null and purchase_date is not null;
update public.it_assets set image_paths = array[image_path] where image_path is not null and cardinality(image_paths) = 0;

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
drop policy if exists "Authenticated users can replace asset images" on storage.objects;
create policy "Authenticated users can replace asset images" on storage.objects
for update to authenticated using (bucket_id = 'it-asset-images' and public.has_access_role(array['super_admin','asset_manager']))
with check (bucket_id = 'it-asset-images' and public.has_access_role(array['super_admin','asset_manager']));
drop policy if exists "Authenticated users can delete asset images" on storage.objects;
create policy "Authenticated users can delete asset images" on storage.objects
for delete to authenticated using (bucket_id = 'it-asset-images' and public.has_access_role(array['super_admin','asset_manager']));

-- Create staff accounts from Supabase Dashboard > Authentication > Users.
-- For production, replace the broad authenticated policies with role-based policies
-- and restrict deletes to designated asset administrators.

-- Managed selectable values for asset registration and materials.
create table if not exists public.system_options (
  id uuid primary key default gen_random_uuid(),
  option_type text not null check (option_type in ('asset_categories','asset_statuses','locations','departments','buildings','floors','assignees','material_categories','ink_types','material_units')),
  value text not null check (length(trim(value)) between 1 and 100),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (option_type, value)
);
create index if not exists system_options_type_active_order_idx on public.system_options(option_type, is_active, sort_order, value);
alter table public.system_options enable row level security;
drop policy if exists "Authenticated users can read system options" on public.system_options;
create policy "Authenticated users can read system options" on public.system_options for select to authenticated using (true);
drop policy if exists "Super admins can add system options" on public.system_options;
create policy "Super admins can add system options" on public.system_options for insert to authenticated with check (public.has_access_role(array['super_admin']));
drop policy if exists "Super admins can update system options" on public.system_options;
create policy "Super admins can update system options" on public.system_options for update to authenticated using (public.has_access_role(array['super_admin'])) with check (public.has_access_role(array['super_admin']));
grant select, insert, update on public.system_options to authenticated;

insert into public.system_options(option_type, value, sort_order) values
('asset_categories','คอมพิวเตอร์',0),('asset_categories','ไฟฟ้าและวิทยุ',1),('asset_categories','โฆษณาและเผยแพร่',2),('asset_categories','อื่น ๆ',3),
('asset_statuses','พร้อมใช้งาน',0),('asset_statuses','กำลังใช้งาน',1),('asset_statuses','เครื่องสำรอง',2),('asset_statuses','ซ่อมบำรุง',3),('asset_statuses','รอแทงจำหน่าย',4),('asset_statuses','แทงจำหน่าย',5),('asset_statuses','ใกล้ครบอายุ',6),
('material_categories','วัสดุสำนักงาน',0),('material_categories','วัสดุคอมพิวเตอร์',1),('material_categories','อุปกรณ์โสตทัศนูปกรณ์',2),('material_categories','วัสดุทำความสะอาด',3),
('ink_types','หมึกอิงค์เจ็ท',0),('ink_types','หมึกเลเซอร์ (Toner)',1),('ink_types','ดรัม/ชุดสร้างภาพ',2),('ink_types','ตลับหมึก',3),
('material_units','ชิ้น',0),('material_units','กล่อง',1),('material_units','ตลับ',2),('material_units','ขวด',3),('material_units','รีม',4),('material_units','ม้วน',5),('material_units','ชุด',6),('material_units','เส้น',7)
on conflict (option_type, value) do nothing;

alter table public.inventory_materials add column if not exists ink_type text;

alter table public.system_options drop constraint if exists system_options_option_type_check;
alter table public.system_options add constraint system_options_option_type_check
  check (option_type in ('asset_categories','asset_statuses','locations','departments','buildings','floors','assignees','material_categories','ink_types','material_units'));
alter table public.it_assets drop constraint if exists it_assets_status_check;
alter table public.it_assets alter column status drop default;
update public.it_assets set status = case status
  when 'ใช้งานปกติ' then 'กำลังใช้งาน' when 'รอซ่อม' then 'ซ่อมบำรุง' when 'ส่งซ่อม' then 'ซ่อมบำรุง'
  when 'รอจำหน่าย' then 'รอแทงจำหน่าย' when 'จำหน่ายแล้ว' then 'แทงจำหน่าย' else status end;
alter table public.it_assets alter column status set default 'พร้อมใช้งาน';
alter table public.it_assets drop constraint if exists it_assets_status_option_fk;
alter table public.it_assets add constraint it_assets_status_option_fk
  foreign key (status_option_type, status)
  references public.system_options(option_type, value)
  on update cascade on delete restrict;

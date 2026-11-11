-- Manage selectable lists used by asset and materials forms.
begin;

create table if not exists public.system_options (
  id uuid primary key default gen_random_uuid(),
  option_type text not null check (option_type in ('asset_categories','locations','departments','buildings','floors','assignees','material_categories','ink_types','material_units')),
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
create policy "Authenticated users can read system options" on public.system_options
for select to authenticated using (true);
drop policy if exists "Super admins can add system options" on public.system_options;
create policy "Super admins can add system options" on public.system_options
for insert to authenticated with check (public.has_access_role(array['super_admin']));
drop policy if exists "Super admins can update system options" on public.system_options;
create policy "Super admins can update system options" on public.system_options
for update to authenticated using (public.has_access_role(array['super_admin']))
with check (public.has_access_role(array['super_admin']));

grant select, insert, update on public.system_options to authenticated;

insert into public.system_options(option_type, value, sort_order) values
('asset_categories','คอมพิวเตอร์',0),('asset_categories','ไฟฟ้าและวิทยุ',1),('asset_categories','โฆษณาและเผยแพร่',2),('asset_categories','อื่น ๆ',3),
('material_categories','วัสดุสำนักงาน',0),('material_categories','วัสดุคอมพิวเตอร์',1),('material_categories','อุปกรณ์โสตทัศนูปกรณ์',2),('material_categories','วัสดุทำความสะอาด',3),
('ink_types','หมึกอิงค์เจ็ท',0),('ink_types','หมึกเลเซอร์ (Toner)',1),('ink_types','ดรัม/ชุดสร้างภาพ',2),('ink_types','ตลับหมึก',3),
('material_units','ชิ้น',0),('material_units','กล่อง',1),('material_units','ตลับ',2),('material_units','ขวด',3),('material_units','รีม',4),('material_units','ม้วน',5),('material_units','ชุด',6),('material_units','เส้น',7)
on conflict (option_type, value) do nothing;

alter table public.inventory_materials add column if not exists ink_type text;

commit;

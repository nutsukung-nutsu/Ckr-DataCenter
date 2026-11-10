-- Add the requested asset details and private equipment image storage.
begin;

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
create index if not exists it_assets_fiscal_year_idx on public.it_assets(fiscal_year);
create index if not exists it_assets_building_idx on public.it_assets(building);

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

commit;

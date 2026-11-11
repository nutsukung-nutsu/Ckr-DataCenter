-- Private photo storage for inventory items.
begin;

alter table public.inventory_materials
  add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('inventory-material-images', 'inventory-material-images', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users with an app role can read inventory material images" on storage.objects;
create policy "Users with an app role can read inventory material images"
on storage.objects for select to authenticated
using (bucket_id = 'inventory-material-images' and public.has_access_role(array['super_admin', 'asset_manager', 'viewer']));

drop policy if exists "Inventory managers can upload material images" on storage.objects;
create policy "Inventory managers can upload material images"
on storage.objects for insert to authenticated
with check (bucket_id = 'inventory-material-images' and public.has_access_role(array['super_admin', 'asset_manager']));

drop policy if exists "Inventory managers can remove material images" on storage.objects;
create policy "Inventory managers can remove material images"
on storage.objects for delete to authenticated
using (bucket_id = 'inventory-material-images' and public.has_access_role(array['super_admin', 'asset_manager']));

commit;

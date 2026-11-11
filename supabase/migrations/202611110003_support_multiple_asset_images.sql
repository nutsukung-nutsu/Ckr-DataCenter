begin;

alter table public.it_assets
  add column if not exists image_paths text[] not null default '{}';

update public.it_assets
set image_paths = array[image_path]
where image_path is not null and cardinality(image_paths) = 0;

drop policy if exists "Authenticated users can replace asset images" on storage.objects;
create policy "Authenticated users can replace asset images" on storage.objects
for update to authenticated
using (bucket_id = 'it-asset-images' and public.has_access_role(array['super_admin','asset_manager']))
with check (bucket_id = 'it-asset-images' and public.has_access_role(array['super_admin','asset_manager']));

commit;

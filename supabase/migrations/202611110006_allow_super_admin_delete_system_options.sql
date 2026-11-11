-- Let Super Admins permanently remove selectable catalog entries.
-- Existing foreign keys still prevent removing status values in use by assets.
begin;

drop policy if exists "Super admins can delete system options" on public.system_options;
create policy "Super admins can delete system options" on public.system_options
for delete to authenticated using (public.has_access_role(array['super_admin']));

grant delete on public.system_options to authenticated;

commit;

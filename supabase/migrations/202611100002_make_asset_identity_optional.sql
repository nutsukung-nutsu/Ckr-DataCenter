-- Allow asset records to be saved before an asset number or product name is known.
begin;

alter table public.it_assets alter column asset_code drop not null;
alter table public.it_assets alter column name drop not null;

commit;

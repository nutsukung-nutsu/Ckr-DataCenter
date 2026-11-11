-- Make asset statuses administrable through system settings and preserve references.
begin;

alter table public.system_options drop constraint if exists system_options_option_type_check;
alter table public.system_options add constraint system_options_option_type_check
  check (option_type in ('asset_categories','asset_statuses','locations','departments','buildings','floors','assignees','material_categories','ink_types','material_units'));

insert into public.system_options(option_type, value, sort_order) values
  ('asset_statuses','พร้อมใช้งาน',0),('asset_statuses','กำลังใช้งาน',1),('asset_statuses','เครื่องสำรอง',2),
  ('asset_statuses','ซ่อมบำรุง',3),('asset_statuses','รอแทงจำหน่าย',4),('asset_statuses','แทงจำหน่าย',5),('asset_statuses','ใกล้ครบอายุ',6)
on conflict (option_type, value) do nothing;

alter table public.it_assets add column if not exists status_option_type text not null default 'asset_statuses';
alter table public.it_assets alter column status drop default;
alter table public.it_assets drop constraint if exists it_assets_status_check;
update public.it_assets set status = case status
  when 'ใช้งานปกติ' then 'กำลังใช้งาน'
  when 'รอซ่อม' then 'ซ่อมบำรุง'
  when 'ส่งซ่อม' then 'ซ่อมบำรุง'
  when 'รอจำหน่าย' then 'รอแทงจำหน่าย'
  when 'จำหน่ายแล้ว' then 'แทงจำหน่าย'
  else status end;
alter table public.it_assets alter column status set default 'พร้อมใช้งาน';
alter table public.it_assets drop constraint if exists it_assets_status_option_fk;
alter table public.it_assets add constraint it_assets_status_option_fk
  foreign key (status_option_type, status)
  references public.system_options(option_type, value)
  on update cascade on delete restrict;

commit;

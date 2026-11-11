-- Link selectable asset assignees to their owning department.
begin;

alter table public.system_options
  add column if not exists department_id uuid references public.system_options(id) on delete set null;

create index if not exists system_options_department_id_idx
  on public.system_options(department_id)
  where option_type = 'assignees';

commit;

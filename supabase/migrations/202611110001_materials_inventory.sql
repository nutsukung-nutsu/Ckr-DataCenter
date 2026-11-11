-- Materials catalog, stock movements, low-stock thresholds, and atomic issue/receive actions.
begin;

create table if not exists public.inventory_materials (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null,
  ink_type text,
  unit text not null default 'ชิ้น',
  quantity numeric(14,3) not null default 0 check (quantity >= 0),
  minimum_quantity numeric(14,3) not null default 0 check (minimum_quantity >= 0),
  location text,
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_materials_category_idx on public.inventory_materials(category);
create index if not exists inventory_materials_name_idx on public.inventory_materials(name);
create index if not exists inventory_materials_low_stock_idx on public.inventory_materials(quantity, minimum_quantity);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references public.inventory_materials(id) on delete restrict,
  transaction_type text not null check (transaction_type in ('receive', 'issue')),
  quantity numeric(14,3) not null check (quantity > 0),
  recipient text,
  reference text,
  note text,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_movements_material_date_idx on public.inventory_movements(material_id, created_at desc);
create index if not exists inventory_movements_created_at_idx on public.inventory_movements(created_at desc);

create or replace function public.set_inventory_material_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists inventory_materials_set_updated_at on public.inventory_materials;
create trigger inventory_materials_set_updated_at
before update on public.inventory_materials
for each row execute function public.set_inventory_material_updated_at();

alter table public.inventory_materials enable row level security;
alter table public.inventory_movements enable row level security;

drop policy if exists "Users with an app role can read inventory materials" on public.inventory_materials;
create policy "Users with an app role can read inventory materials"
on public.inventory_materials for select to authenticated
using (public.has_access_role(array['super_admin', 'asset_manager', 'viewer']));

drop policy if exists "Inventory managers can add materials" on public.inventory_materials;
create policy "Inventory managers can add materials"
on public.inventory_materials for insert to authenticated
with check (public.has_access_role(array['super_admin', 'asset_manager']));

drop policy if exists "Inventory managers can update materials" on public.inventory_materials;
create policy "Inventory managers can update materials"
on public.inventory_materials for update to authenticated
using (public.has_access_role(array['super_admin', 'asset_manager']))
with check (public.has_access_role(array['super_admin', 'asset_manager']));

drop policy if exists "Users with an app role can read inventory movements" on public.inventory_movements;
create policy "Users with an app role can read inventory movements"
on public.inventory_movements for select to authenticated
using (public.has_access_role(array['super_admin', 'asset_manager', 'viewer']));

grant select, insert, update on public.inventory_materials to authenticated;
grant select on public.inventory_movements to authenticated;

create or replace function public.record_inventory_movement(
  p_material_id uuid,
  p_type text,
  p_quantity numeric,
  p_recipient text default null,
  p_reference text default null,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_stock numeric(14,3);
  v_next_stock numeric(14,3);
begin
  if auth.uid() is null or not public.has_access_role(array['super_admin', 'asset_manager']) then
    raise exception 'ไม่มีสิทธิ์จัดการคลังวัสดุ';
  end if;
  if p_type not in ('receive', 'issue') then
    raise exception 'ประเภทรายการรับเข้า/เบิกจ่ายไม่ถูกต้อง';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'จำนวนต้องมากกว่าศูนย์';
  end if;

  select quantity into v_stock
  from public.inventory_materials
  where id = p_material_id
  for update;
  if not found then raise exception 'ไม่พบวัสดุในคลัง'; end if;
  if p_type = 'issue' and v_stock < p_quantity then
    raise exception 'จำนวนคงเหลือไม่เพียงพอ';
  end if;
  v_next_stock := v_stock + case when p_type = 'receive' then p_quantity else -p_quantity end;

  update public.inventory_materials set quantity = v_next_stock where id = p_material_id;
  insert into public.inventory_movements(material_id, transaction_type, quantity, recipient, reference, note, actor_id)
  values (p_material_id, p_type, p_quantity, nullif(trim(p_recipient), ''), nullif(trim(p_reference), ''), nullif(trim(p_note), ''), auth.uid());

  return jsonb_build_object('material_id', p_material_id, 'quantity', v_next_stock, 'transaction_type', p_type);
end;
$$;
revoke all on function public.record_inventory_movement(uuid, text, numeric, text, text, text) from public;
grant execute on function public.record_inventory_movement(uuid, text, numeric, text, text, text) to authenticated;

commit;

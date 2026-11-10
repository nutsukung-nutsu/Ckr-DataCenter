create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'viewer' check (role in ('super_admin', 'asset_manager', 'viewer')),
  assigned_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.has_access_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = any(allowed_roles)
  );
$$;
revoke all on function public.has_access_role(text[]) from public;
grant execute on function public.has_access_role(text[]) to authenticated;

create or replace function public.assign_default_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_roles (user_id, email, role)
  values (
    new.id,
    lower(new.email),
    case when lower(new.email) = 'aphisit.s@ckr.ac.th' then 'super_admin' else 'viewer' end
  )
  on conflict (user_id) do update
    set email = excluded.email,
        role = case when excluded.email = 'aphisit.s@ckr.ac.th' then 'super_admin' else public.user_roles.role end,
        updated_at = now();
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_assign_role on auth.users;
create trigger on_auth_user_created_assign_role
after insert on auth.users
for each row execute function public.assign_default_user_role();

create or replace function public.sync_user_role_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.user_roles set email = lower(new.email), updated_at = now() where user_id = new.id;
  return new;
end;
$$;
drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row when (old.email is distinct from new.email)
execute function public.sync_user_role_email();

create or replace function public.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'super_admin' and (tg_op = 'DELETE' or new.role <> 'super_admin') then
    if (select count(*) from public.user_roles where role = 'super_admin') <= 1 then
      raise exception 'At least one Super Admin must remain';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;
drop trigger if exists user_roles_protect_last_super_admin on public.user_roles;
create trigger user_roles_protect_last_super_admin
before update of role or delete on public.user_roles
for each row execute function public.protect_last_super_admin();

alter table public.user_roles enable row level security;
drop policy if exists "Users can read own role or super admins can read all" on public.user_roles;
create policy "Users can read own role or super admins can read all"
on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_access_role(array['super_admin']));
drop policy if exists "Super admins can add roles" on public.user_roles;
create policy "Super admins can add roles"
on public.user_roles for insert to authenticated
with check (public.has_access_role(array['super_admin']));
drop policy if exists "Super admins can update roles" on public.user_roles;
create policy "Super admins can update roles"
on public.user_roles for update to authenticated
using (public.has_access_role(array['super_admin']))
with check (public.has_access_role(array['super_admin']));
drop policy if exists "Super admins can delete roles" on public.user_roles;
create policy "Super admins can delete roles"
on public.user_roles for delete to authenticated
using (public.has_access_role(array['super_admin']));
grant select, insert, update, delete on public.user_roles to authenticated;

-- Existing accounts become viewers by default; the designated institutional account is promoted.
insert into public.user_roles (user_id, email, role)
select id, lower(email), case when lower(email) = 'aphisit.s@ckr.ac.th' then 'super_admin' else 'viewer' end
from auth.users
where email is not null
on conflict (user_id) do nothing;
update public.user_roles set role = 'super_admin', updated_at = now()
where email = 'aphisit.s@ckr.ac.th';

alter table public.it_assets enable row level security;
drop policy if exists "Authenticated users can read assets" on public.it_assets;
drop policy if exists "Authenticated users can add assets" on public.it_assets;
drop policy if exists "Authenticated users can update assets" on public.it_assets;
drop policy if exists "Authenticated users can delete assets" on public.it_assets;
drop policy if exists "Users with an app role can read assets" on public.it_assets;
drop policy if exists "Asset managers can add assets" on public.it_assets;
drop policy if exists "Asset managers can update assets" on public.it_assets;
drop policy if exists "Super admins can update assets" on public.it_assets;
drop policy if exists "Super admins can delete assets" on public.it_assets;
create policy "Users with an app role can read assets"
on public.it_assets for select to authenticated
using (public.has_access_role(array['super_admin', 'asset_manager', 'viewer']));
create policy "Asset managers can add assets"
on public.it_assets for insert to authenticated
with check (public.has_access_role(array['super_admin', 'asset_manager']));
create policy "Super admins can update assets"
on public.it_assets for update to authenticated
using (public.has_access_role(array['super_admin']))
with check (public.has_access_role(array['super_admin']));
create policy "Super admins can delete assets"
on public.it_assets for delete to authenticated
using (public.has_access_role(array['super_admin']));
grant select, insert, update, delete on public.it_assets to authenticated;

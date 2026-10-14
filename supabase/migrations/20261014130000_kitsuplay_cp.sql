-- KitsuPlay Control Panel foundation. Run in Supabase SQL Editor after checking existing app tables.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'support' check (role in ('owner','admin','support')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);
create table if not exists public.app_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  body text not null check (length(trim(body)) between 1 and 5000),
  kind text not null default 'info' check (kind in ('info','success','warning','maintenance')),
  is_active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.kitsuplay_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
      and is_active = true
      and role in ('owner','admin','support')
  );
$$;
revoke all on function public.kitsuplay_is_admin() from public;
grant execute on function public.kitsuplay_is_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.app_settings enable row level security;
alter table public.app_announcements enable row level security;
alter table public.admin_audit_log enable row level security;

drop policy if exists "admin can read own membership" on public.admin_users;
create policy "admin can read own membership" on public.admin_users
for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "admins can read settings" on public.app_settings;
create policy "admins can read settings" on public.app_settings
for select to authenticated using (public.kitsuplay_is_admin());
drop policy if exists "admins can insert settings" on public.app_settings;
create policy "admins can insert settings" on public.app_settings
for insert to authenticated with check (public.kitsuplay_is_admin());
drop policy if exists "admins can update settings" on public.app_settings;
create policy "admins can update settings" on public.app_settings
for update to authenticated using (public.kitsuplay_is_admin()) with check (public.kitsuplay_is_admin());

drop policy if exists "public can read active announcements" on public.app_announcements;
create policy "public can read active announcements" on public.app_announcements
for select to anon, authenticated using (
  is_active = true and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
);
drop policy if exists "admins can manage announcements" on public.app_announcements;
create policy "admins can manage announcements" on public.app_announcements
for all to authenticated using (public.kitsuplay_is_admin()) with check (public.kitsuplay_is_admin());

drop policy if exists "admins can read audit log" on public.admin_audit_log;
create policy "admins can read audit log" on public.admin_audit_log
for select to authenticated using (public.kitsuplay_is_admin());
drop policy if exists "admins can write audit log" on public.admin_audit_log;
create policy "admins can write audit log" on public.admin_audit_log
for insert to authenticated with check (public.kitsuplay_is_admin());

insert into public.app_settings(key,value)
values ('maintenance_mode','{"enabled":false,"message":""}'::jsonb)
on conflict (key) do nothing;

-- Create an Auth user first, then grant owner access by running:
-- insert into public.admin_users(user_id,role,is_active)
-- values ('AUTH_USER_UUID_HERE','owner',true);
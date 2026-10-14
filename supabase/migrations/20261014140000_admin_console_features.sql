-- KitsuPlay CP admin-console enhancements.
-- Existing app_announcements already has starts_at/ends_at; keep scheduling compatible.
create index if not exists app_announcements_schedule_idx
  on public.app_announcements (is_active, starts_at, ends_at, created_at desc);
create index if not exists admin_audit_log_created_at_idx
  on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_actor_created_idx
  on public.admin_audit_log (actor_id, created_at desc);
create index if not exists admin_users_role_active_idx
  on public.admin_users (role, is_active);

-- Analytics snapshots are deliberately not fabricated. Accurate daily active users/watch time
-- requires the Flutter app to emit events; current admin analytics uses live counts and Auth signups.

-- Enforce least privilege in RLS as well as in the UI/server actions.
create or replace function public.kitsuplay_is_admin()
returns boolean
language sql
stable
security invoker
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

create or replace function public.kitsuplay_is_manager()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
      and is_active = true
      and role in ('owner','admin')
  );
$$;
revoke all on function public.kitsuplay_is_manager() from public;
grant execute on function public.kitsuplay_is_manager() to authenticated;

drop policy if exists "admins can insert settings" on public.app_settings;
drop policy if exists "admins can update settings" on public.app_settings;
create policy "managers can insert settings" on public.app_settings
  for insert to authenticated with check (public.kitsuplay_is_manager());
create policy "managers can update settings" on public.app_settings
  for update to authenticated using (public.kitsuplay_is_manager()) with check (public.kitsuplay_is_manager());

drop policy if exists "admins can manage announcements" on public.app_announcements;
drop policy if exists "admins can read all announcements" on public.app_announcements;
create policy "admins can read all announcements" on public.app_announcements
  for select to authenticated using (public.kitsuplay_is_admin());
create policy "managers can insert announcements" on public.app_announcements
  for insert to authenticated with check (public.kitsuplay_is_manager());
create policy "managers can update announcements" on public.app_announcements
  for update to authenticated using (public.kitsuplay_is_manager()) with check (public.kitsuplay_is_manager());
create policy "managers can delete announcements" on public.app_announcements
  for delete to authenticated using (public.kitsuplay_is_manager());

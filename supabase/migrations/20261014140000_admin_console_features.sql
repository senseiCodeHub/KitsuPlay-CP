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

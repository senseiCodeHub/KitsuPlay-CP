# KitsuPlay CP

KitsuPlay CP is a separate Next.js admin control panel for the KitsuPlay Flutter app, designed for Vercel and Supabase.

## Included
- Responsive dark dashboard
- Supabase email/password sign-in; public sign-up is disabled
- Server-side admin role checks through the admin_users table
- Dashboard metrics for existing profiles, watchlist, and progress tables
- User profile directory and search; Auth ban/unban uses a server-only secret key
- Create and publish announcements
- Maintenance-mode settings
- Administrative audit log
- Supabase migration for admin roles, settings, announcements, and audit records

## Requirements
- Node.js 20.9 or later
- Supabase project
- Existing KitsuPlay app tables: profiles, watchlist, and watch_progress

## Local setup
1. Run npm install.
2. Copy .env.example to .env.local.
3. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.
4. Set SUPABASE_SECRET_KEY only if you want Auth ban/unban. It is server-only and must never be exposed in browser code.
5. Run supabase/migrations/20261014130000_kitsuplay_cp.sql in Supabase SQL Editor.
6. Create an admin user in Supabase Dashboard → Authentication → Users.
7. Grant that user owner role in SQL Editor, replacing the UUID:
   insert into public.admin_users(user_id, role, is_active) values ('AUTH_USER_UUID_HERE','owner',true);
8. Run npm run dev and open http://localhost:3000.

## Vercel
Import senseiCodeHub/KitsuPlay-CP as a Next.js project. Add environment variables in Project Settings → Environment Variables, then deploy. Add the server-only SUPABASE_SECRET_KEY only if using user ban/unban. Redeploy after environment changes.

## Important notes
- Do not put Supabase secret/service-role keys in NEXT_PUBLIC variables or client components.
- This first version has a read-only profile directory plus Auth ban/unban, announcements, maintenance settings, and audit logs. It does not yet offer arbitrary profile editing or a full admin-role management screen.
- The Flutter app must read and enforce maintenance_mode if you want that setting to affect users.
- Confirm existing table names/columns and RLS policies before deployment; no live build or database migration has been run from this environment.

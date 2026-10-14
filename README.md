# KitsuPlay CP

KitsuPlay CP is a separate Next.js admin control panel for the KitsuPlay Flutter app, designed for Vercel and Supabase.

## Included
- Responsive dark dashboard
- Supabase email/password sign-in; public sign-up is disabled
- Server-side admin role checks through the admin_users table
- Dashboard metrics for existing profiles, watchlist, and progress tables
- User directory backed by Supabase Auth, including verified/unverified email status; Auth ban/unban uses a server-only secret key
- Public email verification callback at `/auth/callback`
- Create and publish announcements
- Maintenance-mode settings
- Administrative audit log
- Supabase migration for admin roles, settings, announcements, and audit records

## Requirements
- Node.js 20.9 or later
- Supabase project
- Existing KitsuPlay app tables: profiles, watchlist, and watch_progress

## Local setup
1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Set `SUPABASE_SECRET_KEY` only if you want Auth user management/ban controls. It is server-only and must never be exposed in browser code.
5. Run `supabase/migrations/20261014130000_kitsuplay_cp.sql` in Supabase SQL Editor.\n6. Run `supabase/migrations/20261014140000_admin_console_features.sql` in Supabase SQL Editor to add indexes and least-privilege RLS for admin mutations.
7. Create an admin user in Supabase Dashboard → Authentication → Users.
8. Grant that user owner role in SQL Editor, replacing the UUID:
   `insert into public.admin_users(user_id, role, is_active) values ('AUTH_USER_UUID_HERE','owner',true);`
9. Run `npm run dev` and open `http://localhost:3000`.

## Email verification setup (required for production)

1. In Supabase → Authentication → URL Configuration, set **Site URL** to `https://kitsu-play-cp.vercel.app`.
2. Add `https://kitsu-play-cp.vercel.app/**` to **Redirect URLs**.
3. In Authentication → Email Templates → **Magic Link or OTP**, use a custom link that sends the token hash to the callback. For example:

   ```html
   <h2>Your KitsuPlay sign-in / verification link</h2>
   <p>Open this link to verify your email and continue:</p>
   <p><a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email">Verify email / sign in</a></p>
   <p>If you requested a six-digit code instead, enter {{ .Token }} in the KitsuPlay app.</p>
   ```

   This uses Supabase's one-time token hash and the callback verifies it through Supabase Auth. Do not replace it with a link that sets a database verification flag directly.
4. Save the template and send a fresh email from the Flutter app. Old emails still contain the previous redirect.
5. The Flutter app sends `emailRedirectTo: https://kitsu-play-cp.vercel.app/auth/callback`. The callback displays the result; **User management** shows the authoritative `email_confirmed_at` status read from Supabase Auth.

The six-digit OTP flow remains available. Google sign-in is a separate provider flow and is not treated as email-link verification by this callback.

## Vercel
Import `senseiCodeHub/KitsuPlay-CP` as a Next.js project. Add environment variables in Project Settings → Environment Variables, then deploy. Add the server-only `SUPABASE_SECRET_KEY` only if using Auth user management/ban controls. Redeploy after environment changes.

## Important notes
- Do not put Supabase secret/service-role keys in `NEXT_PUBLIC_*` variables or client components.
- Public verification callback is not an admin route; it verifies only the one-time token issued by Supabase and displays the result. The user directory itself remains admin-protected.
- Analytics registration bars inspect up to the newest 1,000 Auth accounts; high-volume projects may see sampled counts. Full active-user/retention analytics requires event tracking in the Flutter app.\n- User CSV export is capped at 10,000 Auth users per request. Audit CSV export is capped at 10,000 events.\n- Scheduled announcement timestamps are stored in UTC. The Flutter app should respect `starts_at` and `ends_at` when displaying announcements.
- The Flutter app must read and enforce `maintenance_mode` if you want that setting to affect users.
- Confirm existing table names/columns and RLS policies before deployment; the code changes in this repository have not been built or tested in a live environment from this session.

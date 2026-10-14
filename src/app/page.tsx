import Link from "next/link";
import { Bookmark, BellRing, History, UsersRound, ArrowUpRight, ShieldCheck, Activity } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { signOut } from "@/app/signout/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { supabase, user, admin } = await requireAdmin();
  const [profiles, watchlist, progress, announcements] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("watchlist").select("user_id", { count: "exact", head: true }),
    supabase.from("watch_progress").select("user_id", { count: "exact", head: true }),
    supabase.from("app_announcements").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  const cards = [
    { label: "Registered profiles", value: profiles.count, foot: "Accounts in profiles", icon: UsersRound },
    { label: "Watchlist records", value: watchlist.count, foot: "Saved titles", icon: Bookmark },
    { label: "Progress records", value: progress.count, foot: "Synced watch history", icon: History },
    { label: "Live announcements", value: announcements.count, foot: "Currently published", icon: BellRing },
  ];
  const hasErrors = [profiles, watchlist, progress, announcements].some((item) => item.error);

  return (
    <AdminShell active="overview">
      <header className="topbar">
        <div>
          <div className="eyebrow">Operations / Overview</div>
          <h1>Good to see you.</h1>
          <p className="subtle">A clear view of your KitsuPlay app, its members, and recent activity.</p>
        </div>
        <form action={signOut}><button className="button" type="submit">Sign out <ArrowUpRight size={14} aria-hidden="true" /></button></form>
      </header>

      {hasErrors && <div className="notice dashboard-notice">Some metrics could not load. Check the Supabase migration and confirm the app tables and access policies.</div>}

      <section className="stats" aria-label="Application metrics">
        {cards.map(({ label, value, foot, icon: Icon }, index) => (
          <article className="panel stat-card" key={label}>
            <div className="stat-heading"><span>{label}</span><span className="stat-icon"><Icon size={16} strokeWidth={1.8} aria-hidden="true" /></span></div>
            <div className="stat-value">{value ?? "—"}</div>
            <div className="stat-foot"><span className="stat-index">0{index + 1}</span>{foot}</div>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <div className="panel workspace-panel">
          <div className="panel-title"><span>Manage your workspace</span><span className="panel-kicker">QUICK ACCESS</span></div>
          {[
            { title: "User management", desc: "Review member profiles and manage account access.", href: "/users", icon: UsersRound, tag: "MEMBERS" },
            { title: "Announcements", desc: "Publish service updates and maintenance notices.", href: "/announcements", icon: BellRing, tag: "MESSAGING" },
            { title: "App settings", desc: "Configure maintenance mode and its user-facing message.", href: "/settings", icon: Activity, tag: "CONFIG" },
            { title: "Audit log", desc: "Review administrative actions for accountability.", href: "/audit-log", icon: History, tag: "SECURITY" },
          ].map(({ title, desc, href, icon: Icon, tag }) => (
            <Link className="workspace-link" href={href} key={href}>
              <span className="workspace-icon"><Icon size={17} strokeWidth={1.8} aria-hidden="true" /></span>
              <span className="workspace-copy"><span className="row-title">{title}</span><span className="row-meta">{desc}</span></span>
              <span className="workspace-tag">{tag}</span>
              <ArrowUpRight className="workspace-arrow" size={16} aria-hidden="true" />
            </Link>
          ))}
        </div>

        <aside className="panel session-panel">
          <div className="panel-title"><span>Session & access</span><span className="pill"><span className="dot" /> VERIFIED</span></div>
          <div className="session-identity">
            <span className="session-avatar">{(user.email ?? "K").slice(0, 1).toUpperCase()}</span>
            <span><strong>{user.email ?? "Admin account"}</strong><small>Authenticated administrator</small></span>
          </div>
          <div className="session-row"><span>Permission level</span><strong>{admin.role}</strong></div>
          <div className="session-row"><span>Session status</span><strong className="accent-text"><ShieldCheck size={14} /> Active</strong></div>
          <div className="session-foot">Administrative actions are checked server-side against your active Supabase role.</div>
        </aside>
      </section>
      <footer className="page-footer"><span>KITSUPLAY / CONTROL PANEL</span><span>Secure administration · Supabase Auth</span></footer>
    </AdminShell>
  );
}

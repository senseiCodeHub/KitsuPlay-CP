import Link from "next/link";
import { ArrowLeft, UsersRound, Bookmark, History, UserPlus, TrendingUp, Activity } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const { supabase } = await requireAdmin();
  const [profiles, watchlist, progress, announcements] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("watchlist").select("user_id", { count: "exact", head: true }),
    supabase.from("watch_progress").select("user_id", { count: "exact", head: true }),
    supabase.from("app_announcements").select("id", { count: "exact", head: true }).eq("is_active", true),
  ]);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(); date.setUTCHours(0,0,0,0); date.setUTCDate(date.getUTCDate() - (6-index));
    return { key: date.toISOString().slice(0,10), label: date.toLocaleDateString(undefined,{weekday:"short",timeZone:"UTC"}), count: 0 };
  });
  let sampled = false;
  let authUnavailable = false;
  try {
    const client = createAdminClient();
    for (let page = 1; page <= 10; page++) {
      const result = await client.auth.admin.listUsers({ page, perPage: 100 });
      if (result.error) { authUnavailable = true; break; }
      for (const account of result.data.users) {
        if (!account.created_at) continue;
        const key = new Date(account.created_at).toISOString().slice(0,10);
        const day = days.find((entry) => entry.key === key);
        if (day) day.count++;
      }
      if (result.data.users.length < 100) break;
      if (page === 10) sampled = true;
    }
  } catch { authUnavailable = true; }
  const max = Math.max(1, ...days.map((day) => day.count));
  const cards = [
    { title: "Registered profiles", value: profiles.count, note: "Exact database count", icon: UsersRound, error: profiles.error },
    { title: "Watchlist records", value: watchlist.count, note: "Saved-title rows", icon: Bookmark, error: watchlist.error },
    { title: "Progress records", value: progress.count, note: "Watch-progress rows", icon: History, error: progress.error },
    { title: "Active announcements", value: announcements.count, note: "Enabled messages", icon: Activity, error: announcements.error },
  ];
  return <AdminShell active="analytics">
    <header className="topbar"><div><div className="eyebrow">Insights / Usage</div><h1>App analytics</h1><p className="subtle">Current database totals and recent account registrations from Supabase Auth.</p></div><Link className="button" href="/"><ArrowLeft size={14} /> Overview</Link></header>
    <section className="stats analytics-stats">{cards.map(({title,value,note,icon:Icon,error})=><article className="panel stat-card" key={title}><div className="stat-heading"><span>{title}</span><span className="stat-icon"><Icon size={16}/></span></div><div className="stat-value">{error ? "—" : value ?? "—"}</div><div className="stat-foot">{note}</div></article>)}</section>
    <section className="panel analytics-chart"><div className="panel-title"><span>New registrations · last 7 days</span><span className="panel-kicker">SUPABASE AUTH</span></div>
      {authUnavailable && <div className="notice">Registration data is unavailable. Set SUPABASE_SECRET_KEY in Vercel and redeploy.</div>}
      {!authUnavailable && <><p className="section-description">{sampled ? "Recent registration counts are based on the first 1,000 Auth accounts, so older/high-volume projects may be undercounted." : "Counts are grouped by the Auth account creation date in your project's configured timezone (UTC timestamps)."}</p><div className="bar-chart" role="img" aria-label={"New registrations for last seven days: " + days.map(d=>d.label+" "+d.count).join(", ")}>{days.map((day)=><div className="bar-column" key={day.key}><span className="bar-value">{day.count}</span><div className="bar-track"><div className="bar-fill" style={{height: ((day.count/max)*100)+"%"}} /></div><span className="bar-label">{day.label}</span></div>)}</div></>}
    </section>
    <section className="panel analytics-note"><TrendingUp size={17} /><div><strong>Analytics roadmap</strong><p>These metrics are live counts, not estimates of unique active users. For accurate retention, daily active users, watch time, and trends over longer periods, add privacy-conscious events from the Flutter app into a dedicated analytics table.</p></div></section>
  </AdminShell>;
}

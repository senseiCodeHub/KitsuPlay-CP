import Link from "next/link";
import { ArrowLeft, Activity, CheckCircle2, CircleAlert, Database, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function SystemHealthPage() {
  const { supabase, admin } = await requireAdmin();
  const checks: { title: string; detail: string; ok: boolean; severity?: "warning" | "error" }[] = [];
  checks.push({ title: "Supabase public URL", detail: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Environment variable is configured." : "NEXT_PUBLIC_SUPABASE_URL is missing.", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), severity: "error" });
  checks.push({ title: "Public client key", detail: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ? "Publishable key is configured." : "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.", ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY), severity: "error" });
  checks.push({ title: "Server secret", detail: process.env.SUPABASE_SECRET_KEY ? "Server-only secret is configured; its value is never displayed." : "Auth admin functions and administrator directory require SUPABASE_SECRET_KEY.", ok: Boolean(process.env.SUPABASE_SECRET_KEY), severity: "warning" });
  const tableProbes = [
    { table: "profiles", column: "id" },
    { table: "watchlist", column: "user_id" },
    { table: "watch_progress", column: "user_id" },
    { table: "admin_users", column: "user_id" },
    { table: "app_settings", column: "key" },
    { table: "app_announcements", column: "id" },
    { table: "admin_audit_log", column: "id" },
  ];
  const tableResults = await Promise.all(tableProbes.map(async ({ table, column }) => {
    try {
      const result = await supabase.from(table).select(column, { head: true }).limit(0);
      return { table, ok: !result.error, detail: result.error ? "Query failed or access is restricted; review table existence and RLS." : "Query succeeded." };
    } catch { return { table, ok: false, detail: "Query failed; review environment and database availability." }; }
  }));
  checks.push(...tableResults.map((item) => ({ title: "Database table: " + item.table, detail: item.detail, ok: item.ok, severity: "error" as const })));
  let authOk = false;
  let ownerConfigured = false;
  let ownerCheckAvailable = false;
  try {
    const client = createAdminClient();
    const [authResult, ownerResult] = await Promise.all([
      client.auth.admin.listUsers({ page: 1, perPage: 1 }),
      client.from("admin_users").select("user_id", { count: "exact", head: true }).eq("role", "owner").eq("is_active", true),
    ]);
    authOk = !authResult.error;
    ownerCheckAvailable = !ownerResult.error;
    ownerConfigured = !ownerResult.error && (ownerResult.count ?? 0) > 0;
  } catch { authOk = false; }
  checks.push({ title: "Supabase Auth Admin API", detail: authOk ? "Admin API responded successfully." : "Could not verify Auth Admin API. Check the server secret and Supabase Auth service.", ok: authOk, severity: "warning" });
  checks.push({ title: "Owner access bootstrap", detail: !ownerCheckAvailable ? "Could not inspect administrator roles; check SUPABASE_SECRET_KEY." : ownerConfigured ? "At least one active owner is configured." : "No active owner role exists. An existing trusted administrator must be promoted through a reviewed one-time SQL operation before owner-only role management is available.", ok: ownerConfigured, severity: "warning" });
  const healthy = checks.filter((item) => item.ok).length;
  return <AdminShell active="system-health">
    <header className="topbar"><div><div className="eyebrow">Operations / Diagnostics</div><h1>System health</h1><p className="subtle">Read-only checks for configuration, database tables, and Supabase Auth.</p></div><Link className="button" href="/"><ArrowLeft size={14} /> Overview</Link></header>
    <section className="stats"><article className="panel stat-card"><div className="stat-heading"><span>Checks passed</span><span className="stat-icon"><Activity size={16}/></span></div><div className="stat-value">{healthy}<span className="stat-denominator"> / {checks.length}</span></div><div className="stat-foot">Last checked on page load</div></article><article className="panel stat-card"><div className="stat-heading"><span>Administrator role</span><span className="stat-icon"><ShieldCheck size={16}/></span></div><div className="stat-value role-value">{admin.role}</div><div className="stat-foot">Current signed-in session</div></article></section>
    <section className="panel health-panel"><div className="panel-title"><span>Readiness checks</span><span className="panel-kicker">NO MUTATIONS</span></div><div className="health-list">{checks.map((check)=><div className="health-row" key={check.title}><span className={check.ok ? "health-icon health-ok" : "health-icon health-fail"}>{check.ok ? <CheckCircle2 size={17}/> : <CircleAlert size={17}/>}</span><span className="health-copy"><strong>{check.title}</strong><small>{check.detail}</small></span><span className={check.ok ? "status-label status-live" : "status-label status-banned"}>{check.ok ? "Ready" : check.severity === "warning" ? "Needs setup" : "Issue"}</span></div>)}</div></section>
    <p className="section-description health-disclaimer"><Database size={13}/> A successful query confirms access, not complete schema correctness or overall uptime. This page does not expose secrets or perform write tests.</p>
  </AdminShell>;
}

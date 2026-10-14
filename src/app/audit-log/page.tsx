import Link from "next/link";
import { ArrowLeft, ScrollText, ShieldCheck, Clock3 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ action?: string }> }) {
  const { supabase, admin } = await requireAdmin();
  const params = await searchParams;
  const action = (params.action ?? "").trim().slice(0, 80).replace(/[%_]/g, "");
  let query = supabase.from("admin_audit_log").select("id,actor_id,action,target_type,target_id,created_at").order("created_at", { ascending: false }).limit(100);
  if (action) query = query.ilike("action", "%" + action + "%");
  const { data, error } = await query;

  return (
    <AdminShell active="audit-log">
      <header className="topbar">
        <div><div className="eyebrow">Security / Accountability</div><h1>Audit log</h1><p className="subtle">A chronological record of administrative actions performed in the control panel.</p></div>
        <div className="topbar-actions">{["owner", "admin"].includes(admin.role) && <a className="button" href="/api/export/audit-log">Export CSV</a>}<Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link></div>
      </header>
      <section className="panel audit-panel">
        <div className="directory-heading"><div><h2 className="section-heading">Recent activity</h2><p className="section-description">Latest 100 matching recorded events, newest first.</p></div><span className="count-label"><ShieldCheck size={14} aria-hidden="true" /> {data?.length ?? 0} EVENTS</span></div>
        <form className="search-form audit-search" role="search"><input className="field" name="action" defaultValue={action} placeholder="Filter actions, e.g. announcement or user.ban" aria-label="Filter audit actions" /><button className="button primary" type="submit">Filter</button>{action && <Link className="button" href="/audit-log">Clear</Link>}</form>
        {error ? <div className="notice">The audit log is unavailable. Apply the migration and confirm the table permissions.</div> : !data?.length ? (
          <div className="empty-state"><ScrollText size={25} aria-hidden="true" /><strong>No events recorded</strong><span>Administrative actions will appear here when audit logging is triggered.</span></div>
        ) : (
          <div className="table-wrap"><table><thead><tr><th>Action</th><th>Target</th><th>Administrator</th><th>Timestamp</th></tr></thead><tbody>
            {data.map((row) => <tr key={row.id}><td><span className="action-label">{String(row.action).replaceAll("_", " ")}</span></td><td><span className="audit-target">{row.target_type ?? "—"}</span><span className="audit-target-id">{row.target_id ?? "No target ID"}</span></td><td><span className="id-cell" title={row.actor_id ?? ""}>{row.actor_id ? String(row.actor_id).slice(0, 8) + "…" : "System"}</span></td><td><span className="time-cell"><Clock3 size={12} aria-hidden="true" />{new Date(row.created_at).toLocaleString()}</span></td></tr>)}
          </tbody></table></div>
        )}
      </section>
      <p className="audit-footnote"><ShieldCheck size={13} aria-hidden="true" /> Audit records are intended for review; this page does not modify or delete events.</p>
    </AdminShell>
  );
}

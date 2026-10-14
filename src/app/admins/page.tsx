import Link from "next/link";
import { ArrowLeft, ShieldCheck, UsersRound, UserCog, ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { removeAdminAccess, saveAdminRole } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminsPage({ searchParams }: { searchParams: Promise<{ error?: string; updated?: string }> }) {
  const { user, admin } = await requireAdmin();
  if (admin.role !== "owner") {
    return <AdminShell active="admins"><header className="topbar"><div><div className="eyebrow">Security / Permissions</div><h1>Administrator access</h1><p className="subtle">Only the workspace owner can change administrator roles.</p></div><Link className="button" href="/"><ArrowLeft size={14} /> Overview</Link></header><div className="notice">Your current role is <strong>{admin.role}</strong>. Ask the owner if you need access to this section.</div></AdminShell>;
  }
  const params = await searchParams;
  let records: { user_id: string; role: string; is_active: boolean; created_at: string; created_by: string | null }[] = [];
  let emails = new Map<string, string>();
  let loadError = false;
  try {
    const client = createAdminClient();
    const [admins, auth] = await Promise.all([
      client.from("admin_users").select("user_id,role,is_active,created_at,created_by").order("created_at", { ascending: true }),
      client.auth.admin.listUsers({ page: 1, perPage: 100 }),
    ]);
    if (admins.error || auth.error) loadError = true;
    records = admins.data ?? [];
    emails = new Map((auth.data?.users ?? []).map((item) => [item.id, item.email ?? "No email"]));
  } catch { loadError = true; }

  const messages: Record<string, string> = {
    invalid: "Invalid account or role selection.",
    config: "Set SUPABASE_SECRET_KEY in Vercel and redeploy to manage admin roles.",
    self: "You cannot downgrade or remove your own owner access here.",
    lastowner: "The last active owner cannot be downgraded or removed.",
    save: "The role change failed. Check the Supabase secret and admin_users schema.",
  };

  return (
    <AdminShell active="admins">
      <header className="topbar"><div><div className="eyebrow">Security / Permissions</div><h1>Administrator access</h1><p className="subtle">Grant the minimum role needed. Role changes are audited and enforced by the database access model.</p></div><Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link></header>
      {params.error && messages[params.error] && <div className="notice page-notice" role="alert"><ShieldAlert size={15} />{messages[params.error]}</div>}
      {params.updated && <div className="success-banner"><span className="dot" /> Administrator access updated.</div>}
      {loadError && <div className="notice page-notice">Could not load the complete admin directory. Confirm SUPABASE_SECRET_KEY and database access.</div>}
      <section className="panel directory-panel">
        <div className="directory-heading"><div><h2 className="section-heading">Current administrators</h2><p className="section-description">Owner can grant, change, disable, or revoke roles. The last active owner is protected.</p></div><span className="count-label"><UsersRound size={14} /> {records.length} ADMINS</span></div>
        {!records.length ? <div className="empty-state"><UserCog size={24} /><strong>No administrators found</strong><span>Check that the owner account has been inserted into admin_users.</span></div> :
          <div className="table-wrap"><table><thead><tr><th>Account</th><th>Role</th><th>Access</th><th>Granted</th><th>Update role</th><th>Revoke</th></tr></thead><tbody>
            {records.map((item) => <tr key={item.user_id}>
              <td><div className="member-cell"><span className="member-avatar">{(emails.get(item.user_id) ?? item.user_id).slice(0,1).toUpperCase()}</span><span><strong>{emails.get(item.user_id) ?? "Auth user not in first 100 accounts"}</strong><small>{item.user_id === user.id ? "Your account" : item.user_id}</small></span></div></td>
              <td><span className="status-label status-live"><ShieldCheck size={13} />{item.role}</span></td>
              <td><span className={item.is_active ? "status-label status-live" : "status-label"}>{item.is_active ? "Active" : "Disabled"}</span></td>
              <td>{new Date(item.created_at).toLocaleDateString()}</td>
              <td><form action={saveAdminRole} className="role-form"><input type="hidden" name="user_id" value={item.user_id} /><select className="field role-select" name="role" defaultValue={item.role}><option value="owner">Owner</option><option value="admin">Admin</option><option value="support">Support</option></select><label className="compact-check"><input type="checkbox" name="is_active" defaultChecked={item.is_active} /> Active</label><button className="button primary" type="submit">Save</button></form></td>
              <td><form action={removeAdminAccess}><input type="hidden" name="user_id" value={item.user_id} /><button className="button danger" type="submit" disabled={item.user_id === user.id}>Revoke</button></form></td>
            </tr>)}
          </tbody></table></div>}
      </section>
      <section className="panel role-guide"><h2 className="section-heading">Role guide</h2><div className="role-guide-grid"><div><strong>Owner</strong><p>Full access, including managing administrator roles.</p></div><div><strong>Admin</strong><p>Operational access to members, announcements, settings, and audit history.</p></div><div><strong>Support</strong><p>Support workflows and read access; sensitive destructive actions should be restricted.</p></div></div></section>
    </AdminShell>
  );
}

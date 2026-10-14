import Link from "next/link";
import { Search, UsersRound, ArrowLeft, ShieldAlert, MailCheck, MailX } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { setUserBan } from "./actions";

export const dynamic = "force-dynamic";

type DirectoryRow = Record<string, unknown> & {
  id: string;
  email: string | null;
  created_at: string | null;
  email_confirmed_at: string | null;
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string; updated?: string }> }) {
  const { supabase, user } = await requireAdmin();
  const params = await searchParams;
  const q = params.q ?? "";
  const { data: profileData, error: profileError } = await supabase.from("profiles").select("*").limit(100);

  let authUsers: DirectoryRow[] = [];
  let authError = false;
  try {
    const adminClient = createAdminClient();
    const result = await adminClient.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (result.error) authError = true;
    else authUsers = result.data.users.map((authUser) => ({
      id: authUser.id,
      email: authUser.email ?? null,
      created_at: authUser.created_at ?? null,
      email_confirmed_at: authUser.email_confirmed_at ?? null,
    }));
  } catch {
    authError = true;
  }

  const profileById = new Map((profileData ?? []).map((row) => [String(row.id), row]));
  const rows: DirectoryRow[] = authUsers.map((authUser) => ({
    ...(profileById.get(authUser.id) ?? {}),
    ...authUser,
  }));
  const term = q.trim().toLowerCase();
  const filteredRows = rows.filter((row) => !term || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term)));
  const errors: Record<string, string> = {
    invalid: "Invalid account or action.",
    self: "You cannot ban your own admin account.",
    config: "Set SUPABASE_SECRET_KEY in Vercel environment variables to enable Auth user management.",
    save: "The account status could not be changed. Check Supabase Auth permissions and configuration.",
  };

  return (
    <AdminShell active="users">
      <header className="topbar">
        <div>
          <div className="eyebrow">Directory / Members</div>
          <h1>User management</h1>
          <p className="subtle">Review member access and verify each account’s email confirmation status from Supabase Auth.</p>
        </div>
        <Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
      </header>

      {params.error && errors[params.error] && <div className="notice page-notice" role="alert"><ShieldAlert size={15} aria-hidden="true" />{errors[params.error]}</div>}
      {params.updated && <div className="success-banner"><span className="dot" /> Account access was updated.</div>}
      {authError && <div className="notice page-notice" role="alert"><ShieldAlert size={15} aria-hidden="true" />Could not load Supabase Auth users. Confirm SUPABASE_SECRET_KEY is set in Vercel and redeploy.</div>}
      {profileError && <div className="notice page-notice" role="status">Profile details could not be loaded; Auth email and verification status are still shown.</div>}

      <section className="panel directory-panel">
        <div className="directory-heading">
          <div><h2 className="section-heading">Member directory</h2><p className="section-description">Showing {filteredRows.length} matching accounts from up to 100 Auth users.</p></div>
          <span className="count-label"><UsersRound size={14} aria-hidden="true" /> {filteredRows.length} RESULTS</span>
        </div>
        <form className="search-form" role="search">
          <div className="search-input-wrap"><Search size={16} aria-hidden="true" /><input className="field" name="q" placeholder="Search email, name, or account ID…" defaultValue={q} aria-label="Search users" /></div>
          <button className="button primary" type="submit">Search members</button>
          {q && <Link className="button" href="/users">Clear</Link>}
        </form>
        {authError ? <div className="empty-state"><UsersRound size={25} aria-hidden="true" /><strong>Auth directory unavailable</strong><span>Set the server-only Supabase secret key to read email verification status safely.</span></div> : filteredRows.length === 0 ? (
          <div className="empty-state"><UsersRound size={25} aria-hidden="true" /><strong>No matching accounts</strong><span>Try another name, email, or account ID.</span></div>
        ) : (
          <>
            <p className="table-caption">Email status comes directly from Supabase Auth. A confirmed timestamp means the email verification completed; profile data is supplementary.</p>
            <div className="table-wrap"><table><thead><tr><th>Member</th><th>Email</th><th>Email verification</th><th>Created</th><th>Account ID</th><th>Actions</th></tr></thead><tbody>
              {filteredRows.map((row) => {
                const id = row.id;
                const isSelf = id === user.id;
                const displayName = String(row.username ?? row.display_name ?? row.full_name ?? (row.email ? String(row.email).split("@")[0] : "Unnamed member"));
                const confirmed = Boolean(row.email_confirmed_at);
                return <tr key={id}>
                  <td><div className="member-cell"><span className="member-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span><strong>{displayName}</strong><small>{isSelf ? "Your account" : "KitsuPlay member"}</small></span></div></td>
                  <td>{row.email ?? "—"}</td>
                  <td><span className={confirmed ? "status-label status-live" : "status-label"}>{confirmed ? <MailCheck size={13} aria-hidden="true" /> : <MailX size={13} aria-hidden="true" />}{confirmed ? "Verified" : "Unverified"}</span>{confirmed && <small style={{ display: "block", color: "var(--muted-2)", marginTop: 5 }}>{new Date(String(row.email_confirmed_at)).toLocaleString()}</small>}</td>
                  <td>{row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : "—"}</td>
                  <td><span className="id-cell" title={id}>{id.slice(0, 8)}…</span></td>
                  <td><div className="table-actions">
                    <form action={setUserBan}><input type="hidden" name="user_id" value={id} /><input type="hidden" name="action" value="ban" /><button className="button danger" type="submit" disabled={isSelf}>Ban</button></form>
                    <form action={setUserBan}><input type="hidden" name="user_id" value={id} /><input type="hidden" name="action" value="unban" /><button className="button" type="submit" disabled={isSelf}>Unban</button></form>
                  </div></td>
                </tr>;
              })}
            </tbody></table></div>
          </>
        )}
      </section>
    </AdminShell>
  );
}

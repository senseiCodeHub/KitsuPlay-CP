import Link from "next/link";
import { Search, UserRoundSearch, ArrowLeft, ShieldAlert } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { setUserBan } from "./actions";

export const dynamic = "force-dynamic";

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; error?: string; updated?: string }> }) {
  const { supabase, user } = await requireAdmin();
  const params = await searchParams;
  const q = params.q ?? "";
  const { data, error } = await supabase.from("profiles").select("*").limit(100);
  const term = q.trim().toLowerCase();
  const rows = (data ?? []).filter((row) => !term || Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(term)));
  const errors: Record<string, string> = {
    invalid: "Invalid account or action.",
    self: "You cannot ban your own admin account.",
    config: "Set SUPABASE_SECRET_KEY in Vercel environment variables to enable ban/unban.",
    save: "The account status could not be changed. Check Supabase Auth permissions and configuration.",
  };

  return (
    <AdminShell active="users">
      <header className="topbar">
        <div>
          <div className="eyebrow">Directory / Members</div>
          <h1>User management</h1>
          <p className="subtle">Find profiles and manage access to the KitsuPlay application.</p>
        </div>
        <Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
      </header>

      {params.error && errors[params.error] && <div className="notice page-notice" role="alert"><ShieldAlert size={15} aria-hidden="true" />{errors[params.error]}</div>}
      {params.updated && <div className="success-banner"><span className="dot" /> Account access was updated.</div>}

      <section className="panel directory-panel">
        <div className="directory-heading">
          <div><h2 className="section-heading">Member directory</h2><p className="section-description">Showing {rows.length} matching profiles from up to 100 loaded records.</p></div>
          <span className="count-label"><UserRoundSearch size={14} aria-hidden="true" /> {rows.length} RESULTS</span>
        </div>
        <form className="search-form" role="search">
          <div className="search-input-wrap"><Search size={16} aria-hidden="true" /><input className="field" name="q" placeholder="Search profile fields…" defaultValue={q} aria-label="Search profiles" /></div>
          <button className="button primary" type="submit">Search members</button>
          {q && <Link className="button" href="/users">Clear</Link>}
        </form>
        {error ? <div className="notice">Could not read profiles. Confirm the profiles schema and authenticated-user RLS policies.</div> : rows.length === 0 ? (
          <div className="empty-state"><UserRoundSearch size={25} aria-hidden="true" /><strong>No matching profiles</strong><span>Try another name, email, or profile ID.</span></div>
        ) : (
          <>
            <p className="table-caption">Account access actions apply to the matching Supabase Auth user ID. Your own account cannot be banned here.</p>
            <div className="table-wrap"><table><thead><tr><th>Member</th><th>Email</th><th>Created</th><th>Account ID</th><th>Actions</th></tr></thead><tbody>
              {rows.map((row, index) => {
                const id = String(row.id ?? "");
                const isSelf = id === user.id;
                const displayName = String(row.username ?? row.display_name ?? row.full_name ?? "Unnamed member");
                return <tr key={id || index}>
                  <td><div className="member-cell"><span className="member-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span><strong>{displayName}</strong><small>{isSelf ? "Your account" : "KitsuPlay member"}</small></span></div></td>
                  <td>{String(row.email ?? "—")}</td>
                  <td>{row.created_at ? new Date(String(row.created_at)).toLocaleDateString() : "—"}</td>
                  <td><span className="id-cell" title={id}>{id ? id.slice(0, 8) + "…" : "—"}</span></td>
                  <td>{id && <div className="table-actions">
                    <form action={setUserBan}><input type="hidden" name="user_id" value={id} /><input type="hidden" name="action" value="ban" /><button className="button danger" type="submit" disabled={isSelf}>Ban</button></form>
                    <form action={setUserBan}><input type="hidden" name="user_id" value={id} /><input type="hidden" name="action" value="unban" /><button className="button" type="submit" disabled={isSelf}>Unban</button></form>
                  </div>}</td>
                </tr>;
              })}
            </tbody></table></div>
          </>
        )}
      </section>
    </AdminShell>
  );
}

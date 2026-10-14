import Link from "next/link";
import { Search, UsersRound, ArrowLeft, ShieldAlert, MailCheck, MailX, ChevronLeft, ChevronRight, Ban, UserRoundCheck } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { setUserBan } from "./actions";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type DirectoryRow = Record<string, unknown> & {
  id: string;
  email: string | null;
  created_at: string | null;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
};

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; page?: string; error?: string; updated?: string }> }) {
  const { supabase, user } = await requireAdmin();
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 120);
  const page = Math.max(1, Math.min(10000, Number.parseInt(params.page ?? "1", 10) || 1));
  const status = ["all", "verified", "unverified", "banned", "active"].includes(params.status ?? "") ? params.status ?? "all" : "all";

  let authUsers: DirectoryRow[] = [];
  let authError = false;
  try {
    const adminClient = createAdminClient();
    const result = await adminClient.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
    if (result.error) authError = true;
    else authUsers = result.data.users.map((authUser) => ({
      id: authUser.id,
      email: authUser.email ?? null,
      created_at: authUser.created_at ?? null,
      email_confirmed_at: authUser.email_confirmed_at ?? null,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      banned_until: authUser.banned_until ?? null,
    }));
  } catch {
    authError = true;
  }

  const { data: profileData, error: profileError } = authUsers.length
    ? await supabase.from("profiles").select("*").in("id", authUsers.map((item) => item.id))
    : { data: [], error: null };

  const profileById = new Map((profileData ?? []).map((row) => [String(row.id), row]));
  const rows: DirectoryRow[] = authUsers.map((authUser) => ({
    ...(profileById.get(authUser.id) ?? {}),
    ...authUser,
  }));
  const getName = (row: DirectoryRow) => String(row.username ?? row.display_name ?? row.full_name ?? (row.email ? row.email.split("@")[0] : "Unnamed member"));
  const isBanned = (row: DirectoryRow) => Boolean(row.banned_until && Date.parse(row.banned_until) > Date.now());
  const term = q.toLowerCase();
  const filteredRows = rows.filter((row) => {
    const matchesQuery = !term || [row.id, row.email, getName(row)].some((value) => String(value ?? "").toLowerCase().includes(term));
    const banned = isBanned(row);
    const verified = Boolean(row.email_confirmed_at);
    const matchesStatus = status === "all" || (status === "verified" && verified) || (status === "unverified" && !verified) || (status === "banned" && banned) || (status === "active" && !banned);
    return matchesQuery && matchesStatus;
  });
  const errors: Record<string, string> = {
    invalid: "Invalid account or action.",
    self: "You cannot ban your own admin account.",
    config: "Set SUPABASE_SECRET_KEY in Vercel environment variables to enable Auth user management.",
    save: "The account status could not be changed. Check Supabase Auth permissions and configuration.",
  };
  const pageHref = (nextPage: number) => {
    const query = new URLSearchParams();
    query.set("page", String(nextPage));
    if (q) query.set("q", q);
    if (status !== "all") query.set("status", status);
    return "/users?" + query.toString();
  };

  return (
    <AdminShell active="users">
      <header className="topbar">
        <div>
          <div className="eyebrow">Directory / Members</div>
          <h1>User management</h1>
          <p className="subtle">Search accounts, inspect email verification, and manage access with clear status and paginated results.</p>
        </div>
        <Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
      </header>

      {params.error && errors[params.error] && <div className="notice page-notice" role="alert"><ShieldAlert size={15} aria-hidden="true" />{errors[params.error]}</div>}
      {params.updated && <div className="success-banner"><span className="dot" /> Account access was updated.</div>}
      {authError && <div className="notice page-notice" role="alert"><ShieldAlert size={15} aria-hidden="true" />Could not load Supabase Auth users. Confirm SUPABASE_SECRET_KEY is set in Vercel and redeploy.</div>}
      {profileError && <div className="notice page-notice" role="status">Profile details could not be loaded; Auth email and verification status are still shown.</div>}

      <section className="panel directory-panel">
        <div className="directory-heading">
          <div><h2 className="section-heading">Member directory</h2><p className="section-description">Page {page} · {filteredRows.length} matching accounts on this page, {PAGE_SIZE} loaded per request.</p></div>
          <span className="count-label"><UsersRound size={14} aria-hidden="true" /> {filteredRows.length} MATCHES</span>
        </div>
        <form className="search-form" role="search">
          <div className="search-input-wrap"><Search size={16} aria-hidden="true" /><input className="field" name="q" placeholder="Search this page by email, name, or ID…" defaultValue={q} aria-label="Search current page of users" /></div>
          <select className="field status-filter" name="status" defaultValue={status} aria-label="Filter by account status">
            <option value="all">All statuses</option><option value="verified">Email verified</option><option value="unverified">Email unverified</option><option value="banned">Banned accounts</option><option value="active">Active accounts</option>
          </select>
          <button className="button primary" type="submit">Apply</button>
          {(q || status !== "all") && <Link className="button" href="/users">Clear</Link>}
        </form>
        {authError ? <div className="empty-state"><UsersRound size={25} aria-hidden="true" /><strong>Auth directory unavailable</strong><span>Set the server-only Supabase secret key to read email verification and account access safely.</span></div> : filteredRows.length === 0 ? (
          <div className="empty-state"><UsersRound size={25} aria-hidden="true" /><strong>No matching accounts on this page</strong><span>Change the filter or move to another page. Search currently applies to the loaded page only.</span></div>
        ) : (
          <>
            <p className="table-caption">Email verification is read directly from Supabase Auth. Account access status reflects the Auth ban expiry. Search and filters apply to the currently loaded page.</p>
            <div className="table-wrap"><table><thead><tr><th>Member</th><th>Email</th><th>Email verification</th><th>Account status</th><th>Last sign-in</th><th>Created</th><th>Actions</th></tr></thead><tbody>
              {filteredRows.map((row) => {
                const id = row.id;
                const isSelf = id === user.id;
                const displayName = getName(row);
                const confirmed = Boolean(row.email_confirmed_at);
                const banned = isBanned(row);
                return <tr key={id}>
                  <td><div className="member-cell"><span className="member-avatar">{displayName.slice(0, 1).toUpperCase()}</span><span><strong>{displayName}</strong><small>{isSelf ? "Your account" : "KitsuPlay member"}</small></span></div></td>
                  <td>{row.email ?? "—"}</td>
                  <td><span className={confirmed ? "status-label status-live" : "status-label"}>{confirmed ? <MailCheck size={13} aria-hidden="true" /> : <MailX size={13} aria-hidden="true" />}{confirmed ? "Verified" : "Unverified"}</span>{confirmed && <small className="status-detail">{new Date(String(row.email_confirmed_at)).toLocaleDateString()}</small>}</td>
                  <td><span className={banned ? "status-label status-banned" : "status-label status-live"}>{banned ? <Ban size={13} aria-hidden="true" /> : <UserRoundCheck size={13} aria-hidden="true" />}{banned ? "Banned" : "Active"}</span></td>
                  <td>{row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleDateString() : "Never"}</td>
                  <td>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "—"}</td>
                  <td><div className="table-actions">
                    {banned
                      ? <form action={setUserBan}><input type="hidden" name="user_id" value={id} /><input type="hidden" name="action" value="unban" /><button className="button" type="submit" disabled={isSelf}>Unban</button></form>
                      : <form action={setUserBan}><input type="hidden" name="user_id" value={id} /><input type="hidden" name="action" value="ban" /><button className="button danger" type="submit" disabled={isSelf}>Ban</button></form>}
                  </div></td>
                </tr>;
              })}
            </tbody></table></div>
          </>
        )}
        <div className="pagination">
          <Link className={"button" + (page <= 1 ? " button-muted" : "")} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined} href={page <= 1 ? "/users" : pageHref(page - 1)}><ChevronLeft size={14} aria-hidden="true" /> Previous</Link>
          <span>Page {page}</span>
          <Link className={"button" + (authUsers.length < PAGE_SIZE ? " button-muted" : "")} aria-disabled={authUsers.length < PAGE_SIZE} tabIndex={authUsers.length < PAGE_SIZE ? -1 : undefined} href={authUsers.length < PAGE_SIZE ? pageHref(page) : pageHref(page + 1)}>Next <ChevronRight size={14} aria-hidden="true" /></Link>
        </div>
      </section>
    </AdminShell>
  );
}

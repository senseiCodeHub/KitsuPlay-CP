import Link from "next/link";
import { ArrowLeft, Megaphone, Send, Clock } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createAnnouncement, toggleAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string }> }) {
  const { supabase, admin } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await supabase.from("app_announcements").select("id,title,body,kind,is_active,starts_at,ends_at,created_at").order("created_at", { ascending: false }).limit(50);

  return (
    <AdminShell active="announcements">
      <header className="topbar">
        <div><div className="eyebrow">Messaging / Updates</div><h1>Announcements</h1><p className="subtle">Write clear updates for your KitsuPlay users and control when each message is published.</p></div>
        <Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
      </header>

      {params.error && <div className="notice page-notice" role="alert">{params.error === "invalid" ? "Check the title, message, and schedule. End time must be later than start time." : "Could not save the announcement. Check the required fields and Supabase migration."}</div>}
      {params.created && <div className="success-banner"><span className="dot" /> Announcement created successfully.</div>}
      {params.updated && <div className="success-banner"><span className="dot" /> Announcement status updated.</div>}

      <section className="content-grid announcement-grid">
        <div className="panel announcement-editor">
          <div className="section-icon"><Megaphone size={18} aria-hidden="true" /></div>
          <div className="section-kicker">COMPOSE</div>
          <h2 className="section-heading">Create a message</h2>
          <p className="section-description">Keep it useful, direct, and easy to understand.</p>
          {admin.role === "support" ? <div className="notice">Support role has read-only access to announcements.</div> : <form className="form announcement-form" action={createAnnouncement}>
            <label className="label">Announcement title<input className="field" name="title" maxLength={120} placeholder="e.g. Scheduled maintenance" required /></label>
            <label className="label">Message<textarea className="field" name="body" rows={6} maxLength={5000} placeholder="What should users know?" required /></label>
            <label className="label">Message category<select className="field" name="kind" defaultValue="info"><option value="info">Information</option><option value="success">Success</option><option value="warning">Warning</option><option value="maintenance">Maintenance</option></select></label>
            <label className="label">Starts at (UTC, optional)<input className="field" type="datetime-local" name="starts_at" /><small className="form-help">Use UTC time. Leave blank to make it eligible to show immediately when published.</small></label>\n            <label className="label">Expires at (UTC, optional)<input className="field" type="datetime-local" name="ends_at" /><small className="form-help">Use UTC time. After this time, the app should no longer display the announcement.</small></label>\n            <label className="publish-toggle"><input type="checkbox" name="is_active" /><span><strong>Enable announcement</strong><small>Scheduled announcements only become visible inside their start/end window.</small></span></label>
            <button className="button primary submit-wide" type="submit"><Send size={14} aria-hidden="true" /> Save announcement</button>
          </form>
        </div>

        <div className="panel announcement-list">
          <div className="list-heading"><div><div className="section-kicker">MESSAGE HISTORY</div><h2 className="section-heading">Recent announcements</h2></div><span className="count-label">{data?.length ?? 0} / 50</span></div>
          {error ? <div className="notice">The announcements table is unavailable. Apply the SQL migration.</div> : !data?.length ? (
            <div className="empty-state"><Megaphone size={25} aria-hidden="true" /><strong>Nothing published yet</strong><span>Your saved announcements will appear here.</span></div>
          ) : data.map((item) => (
            <article className="announcement-item" key={item.id}>
              <div className="announcement-item-top"><span className={"kind-label kind-" + item.kind}>{item.kind}</span><span className={item.is_active ? "status-label status-live" : "status-label"}><span />{!item.is_active ? "Disabled" : item.starts_at && new Date(item.starts_at).getTime() > Date.now() ? "Scheduled" : item.ends_at && new Date(item.ends_at).getTime() <= Date.now() ? "Expired" : "Published"}</span></div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              {(item.starts_at || item.ends_at) && <div className="announcement-schedule">{item.starts_at && <span>Starts {new Date(item.starts_at).toLocaleString()}</span>}{item.ends_at && <span>Ends {new Date(item.ends_at).toLocaleString()}</span>}</div>}\n              <div className="announcement-item-footer"><span><Clock size={12} aria-hidden="true" />{new Date(item.created_at).toLocaleDateString()}</span>{admin.role === "support" ? <span className="muted-small">Read only</span> : <form action={toggleAnnouncement}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={String(!item.is_active)} /><button className="button" type="submit">{item.is_active ? "Disable" : "Enable"}</button></form>}</div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

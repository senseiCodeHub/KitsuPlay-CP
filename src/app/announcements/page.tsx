import Link from "next/link";
import { ArrowLeft, Megaphone, Send, Clock3 } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createAnnouncement, toggleAnnouncement } from "./actions";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage({ searchParams }: { searchParams: Promise<{ error?: string; created?: string; updated?: string }> }) {
  const { supabase } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await supabase.from("app_announcements").select("id,title,body,kind,is_active,created_at").order("created_at", { ascending: false }).limit(50);

  return (
    <AdminShell active="announcements">
      <header className="topbar">
        <div><div className="eyebrow">Messaging / Updates</div><h1>Announcements</h1><p className="subtle">Write clear updates for your KitsuPlay users and control when each message is published.</p></div>
        <Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
      </header>

      {params.error && <div className="notice page-notice" role="alert">Could not save the announcement. Check the required fields and Supabase migration.</div>}
      {params.created && <div className="success-banner"><span className="dot" /> Announcement created successfully.</div>}
      {params.updated && <div className="success-banner"><span className="dot" /> Announcement status updated.</div>}

      <section className="content-grid announcement-grid">
        <div className="panel announcement-editor">
          <div className="section-icon"><Megaphone size={18} aria-hidden="true" /></div>
          <div className="section-kicker">COMPOSE</div>
          <h2 className="section-heading">Create a message</h2>
          <p className="section-description">Keep it useful, direct, and easy to understand.</p>
          <form className="form announcement-form" action={createAnnouncement}>
            <label className="label">Announcement title<input className="field" name="title" maxLength={120} placeholder="e.g. Scheduled maintenance" required /></label>
            <label className="label">Message<textarea className="field" name="body" rows={6} maxLength={5000} placeholder="What should users know?" required /></label>
            <label className="label">Message category<select className="field" name="kind" defaultValue="info"><option value="info">Information</option><option value="success">Success</option><option value="warning">Warning</option><option value="maintenance">Maintenance</option></select></label>
            <label className="publish-toggle"><input type="checkbox" name="is_active" /><span><strong>Publish immediately</strong><small>Make this announcement visible as soon as it is saved.</small></span></label>
            <button className="button primary submit-wide" type="submit"><Send size={14} aria-hidden="true" /> Save announcement</button>
          </form>
        </div>

        <div className="panel announcement-list">
          <div className="list-heading"><div><div className="section-kicker">MESSAGE HISTORY</div><h2 className="section-heading">Recent announcements</h2></div><span className="count-label">{data?.length ?? 0} / 50</span></div>
          {error ? <div className="notice">The announcements table is unavailable. Apply the SQL migration.</div> : !data?.length ? (
            <div className="empty-state"><Megaphone size={25} aria-hidden="true" /><strong>Nothing published yet</strong><span>Your saved announcements will appear here.</span></div>
          ) : data.map((item) => (
            <article className="announcement-item" key={item.id}>
              <div className="announcement-item-top"><span className={"kind-label kind-" + item.kind}>{item.kind}</span><span className={item.is_active ? "status-label status-live" : "status-label"}><span />{item.is_active ? "Published" : "Draft"}</span></div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
              <div className="announcement-item-footer"><span><Clock3 size={12} aria-hidden="true" />{new Date(item.created_at).toLocaleDateString()}</span><form action={toggleAnnouncement}><input type="hidden" name="id" value={item.id} /><input type="hidden" name="active" value={String(!item.is_active)} /><button className="button" type="submit">{item.is_active ? "Unpublish" : "Publish"}</button></form></div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}

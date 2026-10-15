import Link from "next/link";
import { ArrowLeft, Wrench, Save, AlertTriangle, ShieldCheck, Smartphone, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveSettings, saveAppUpdateSettings } from "./actions";

export const dynamic = "force-dynamic";

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; update_saved?: string }> }) {
  const { supabase, admin } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await supabase.from("app_settings").select("key,value").eq("key", "maintenance_mode").maybeSingle();

  // app_updates has public read access only for currently active releases, so use the
  // server-only service client after requireAdmin has authenticated and authorized this page.
  const adminClient = createAdminClient();
  const { data: updateData, error: updateError } = await adminClient
    .from("app_updates")
    .select("id,version,version_code,title,body,download_url,force_update,is_active,starts_at,ends_at,created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const value = (data?.value ?? { enabled: false, message: "" }) as { enabled?: boolean; message?: string };
  const update = updateData ?? null;

  return (
    <AdminShell active="settings">
      <header className="topbar">
        <div><div className="eyebrow">Configuration / Availability</div><h1>App settings</h1><p className="subtle">Manage operational settings for the KitsuPlay application.</p></div>
        <Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
      </header>

      {(error || updateError) && <div className="notice page-notice" role="alert">Some settings could not be loaded. Check the Supabase configuration and policies.</div>}
      {params.error && <div className="notice page-notice" role="alert">{params.error === "update_invalid" ? "Check the version, version code, title, message, valid HTTPS link, and schedule dates." : "Settings could not be saved. Check the database configuration and try again."}</div>}
      {params.update_saved && <div className="success-banner"><span className="dot" /> App update release saved successfully.</div>}
      {params.saved && <div className="success-banner"><span className="dot" /> Settings saved successfully.</div>}

      <section className="settings-layout">
        <div className="panel settings-main">
          <div className="section-icon"><Wrench size={18} aria-hidden="true" /></div>
          <div className="section-kicker">SERVICE CONTROLS</div>
          <h2 className="section-heading">Maintenance mode</h2>
          <p className="section-description">Use this when the app needs planned downtime. Save a clear message so your client can explain the interruption to users.</p>
          {admin.role === "support" ? <div className="notice">Support role has read-only access to service settings.</div> : <form action={saveSettings} className="form settings-form">
            <label className="maintenance-switch">
              <input type="checkbox" name="enabled" defaultChecked={Boolean(value.enabled)} />
              <span className="switch-copy"><strong>Enable maintenance mode</strong><small>Store this state in Supabase for the Flutter app to read.</small></span>
              <span className={value.enabled ? "mode-status mode-on" : "mode-status"}>{value.enabled ? "Enabled" : "Disabled"}</span>
            </label>
            <label className="label">Maintenance message<textarea className="field" name="message" rows={5} maxLength={1000} placeholder="Tell users what is happening and when to try again." defaultValue={value.message ?? ""} /></label>
            <div className="form-help">Maximum 1,000 characters. Your Flutter app must read and enforce this setting for maintenance mode to affect users.</div>
            <button className="button primary submit-wide" type="submit"><Save size={14} aria-hidden="true" /> Save settings</button>
          </form>}
        </div>

        <aside className="settings-aside">
          <div className="panel settings-info">
            <div className="info-icon"><ShieldCheck size={17} aria-hidden="true" /></div>
            <h3>Safe by default</h3>
            <p>Only authenticated admins with an active role can update settings. Requests are handled on the server.</p>
          </div>
          <div className="panel settings-warning">
            <div className="warning-title"><AlertTriangle size={15} aria-hidden="true" /> Important</div>
            <p>Saving maintenance mode does not automatically block API requests. Your Flutter app must check this setting and decide what users should see.</p>
          </div>
        </aside>
      </section>

      <section className="settings-layout app-update-layout">
        <div className="panel settings-main">
          <div className="section-icon"><Smartphone size={18} aria-hidden="true" /></div>
          <div className="section-kicker">MOBILE APP RELEASE</div>
          <h2 className="section-heading">App update</h2>
          <p className="section-description">Manage the release record stored in Supabase <code>app_updates</code>. Only one release should be active for clients at a time.</p>
          {admin.role === "support" ? <div className="notice">Support role has read-only access to app update releases.</div> : <form action={saveAppUpdateSettings} className="form settings-form">
            <input type="hidden" name="id" value={update?.id ?? ""} />
            <label className="maintenance-switch">
              <input type="checkbox" name="is_active" defaultChecked={Boolean(update?.is_active)} />
              <span className="switch-copy"><strong>Publish this release</strong><small>Inactive releases are hidden from the public update API.</small></span>
              <span className={update?.is_active ? "mode-status mode-on" : "mode-status"}>{update?.is_active ? "Published" : "Draft"}</span>
            </label>
            <label className="label">Latest version<input className="field" name="version" maxLength={32} placeholder="e.g. 1.2.0" defaultValue={update?.version ?? ""} required /></label>
            <label className="label">Version code<input className="field" name="version_code" type="number" min="1" max="2147483647" step="1" defaultValue={update?.version_code ?? ""} required /></label>
            <label className="label">Notice title<input className="field" name="title" maxLength={160} placeholder="A faster, sharper KitsuPlay" defaultValue={update?.title ?? ""} required /></label>
            <label className="label">Notice message<textarea className="field" name="body" rows={5} maxLength={8000} placeholder="Describe the changes in this release." defaultValue={update?.body ?? ""} required /></label>
            <label className="maintenance-switch">
              <input type="checkbox" name="force_update" defaultChecked={Boolean(update?.force_update)} />
              <span className="switch-copy"><strong>Force update</strong><small>Tell the app to require updating before continuing. The Flutter client must enforce this.</small></span>
              <span className={update?.force_update ? "mode-status mode-on" : "mode-status"}>{update?.force_update ? "Required" : "Optional"}</span>
            </label>
            <label className="label">Download / update URL<input className="field" name="download_url" type="url" inputMode="url" maxLength={2048} placeholder="https://play.google.com/store/apps/details?id=..." defaultValue={update?.download_url ?? ""} required /></label>
            <label className="label">Publish from (UTC, optional)<input className="field" name="starts_at" type="datetime-local" defaultValue={toDateTimeLocal(update?.starts_at)} /></label>
            <label className="label">Publish until (UTC, optional)<input className="field" name="ends_at" type="datetime-local" defaultValue={toDateTimeLocal(update?.ends_at)} /></label>
            <div className="form-help">The public API only returns active releases whose schedule includes the current time. Use a trusted HTTPS link. If no schedule is set, the release is available immediately while active.</div>
            <button className="button primary submit-wide" type="submit"><Save size={14} aria-hidden="true" /> Save release</button>
          </form>}
        </div>
        <aside className="settings-aside">
          <div className="panel settings-info">
            <div className="info-icon"><ExternalLink size={17} aria-hidden="true" /></div>
            <h3>App update API</h3>
            <p>The Flutter app can request <code>/api/app-update</code>. The endpoint reads the active, currently scheduled release from <code>app_updates</code>.</p>
            <a className="button" href="/api/app-update" target="_blank" rel="noreferrer">Preview API response <ExternalLink size={13} aria-hidden="true" /></a>
          </div>
          <div className="panel settings-warning">
            <div className="warning-title"><AlertTriangle size={15} aria-hidden="true" /> Important</div>
            <p>This panel publishes release metadata. The Flutter app must compare version codes, show the notice, open the update link, and enforce force-update behavior.</p>
          </div>
          {update && <div className="panel settings-info"><h3>Current database record</h3><p>Version <strong>{update.version}</strong> (code {update.version_code})</p><p>Status: <strong>{update.is_active ? "Active" : "Draft / inactive"}</strong></p><p>Created: {new Date(update.created_at).toLocaleString()}</p></div>}
        </aside>
      </section>
    </AdminShell>
  );
}

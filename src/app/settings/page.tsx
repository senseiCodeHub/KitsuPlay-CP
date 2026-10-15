import Link from "next/link";
import { ArrowLeft, Wrench, Save, AlertTriangle, ShieldCheck, Smartphone, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { saveSettings, saveAppUpdateSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string; update_saved?: string }> }) {
  const { supabase, admin } = await requireAdmin();
  const params = await searchParams;
  const { data, error } = await supabase.from("app_settings").select("key,value").eq("key", "maintenance_mode").maybeSingle();
  const { data: updateData, error: updateError } = await supabase.from("app_settings").select("key,value").eq("key", "app_update_config").maybeSingle();
  const value = (data?.value ?? { enabled: false, message: "" }) as { enabled?: boolean; message?: string };
  const update = (updateData?.value ?? {}) as { enabled?: boolean; latest_version?: string; latest_version_code?: number; title?: string; message?: string; force_update?: boolean; update_url?: string };

  return (
    <AdminShell active="settings">
      <header className="topbar">
        <div><div className="eyebrow">Configuration / Availability</div><h1>App settings</h1><p className="subtle">Manage operational settings for the KitsuPlay application.</p></div>
        <Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
      </header>

      {(error || updateError) && <div className="notice page-notice" role="alert">Some settings could not be loaded. Check the Supabase configuration and policies.</div>}
      {params.error && <div className="notice page-notice" role="alert">{params.error === "update_invalid" ? "Check the version, version code, title, message, and valid HTTPS update link." : "Settings could not be saved. Check the database policy and try again."}</div>}
      {params.update_saved && <div className="success-banner"><span className="dot" /> App update settings saved successfully.</div>}
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
          <h2 className="section-heading">App update notice</h2>
          <p className="section-description">Publish an update notice for your Flutter app. The app can fetch the active configuration from <code>/api/app-update</code>.</p>
          {admin.role === "support" ? <div className="notice">Support role has read-only access to app update settings.</div> : <form action={saveAppUpdateSettings} className="form settings-form">
            <label className="maintenance-switch">
              <input type="checkbox" name="enabled" defaultChecked={Boolean(update.enabled)} />
              <span className="switch-copy"><strong>Enable update notice</strong><small>Turn this off to stop showing the update prompt.</small></span>
              <span className={update.enabled ? "mode-status mode-on" : "mode-status"}>{update.enabled ? "Published" : "Disabled"}</span>
            </label>
            <label className="label">Latest version<input className="field" name="latest_version" maxLength={30} placeholder="e.g. 1.2.0" defaultValue={update.latest_version ?? ""} required /></label>
            <label className="label">Version code<input className="field" name="latest_version_code" type="number" min="1" max="2147483647" step="1" defaultValue={update.latest_version_code ?? ""} required /></label>
            <label className="label">Notice title<input className="field" name="title" maxLength={120} placeholder="A new version is available" defaultValue={update.title ?? "A new version is available"} required /></label>
            <label className="label">Notice message<textarea className="field" name="message" rows={4} maxLength={1000} placeholder="Tell users what changed in this release." defaultValue={update.message ?? ""} required /></label>
            <label className="maintenance-switch">
              <input type="checkbox" name="force_update" defaultChecked={Boolean(update.force_update)} />
              <span className="switch-copy"><strong>Force update</strong><small>Tell the app to require updating before continuing. Your Flutter app must enforce this flag.</small></span>
              <span className={update.force_update ? "mode-status mode-on" : "mode-status"}>{update.force_update ? "Required" : "Optional"}</span>
            </label>
            <label className="label">Update link<input className="field" name="update_url" type="url" inputMode="url" maxLength={2048} placeholder="https://play.google.com/store/apps/details?id=..." defaultValue={update.update_url ?? ""} required /></label>
            <div className="form-help">Use a valid HTTPS link to Google Play or your trusted APK download page. Force update only works when the Flutter app checks this endpoint and blocks the app when required.</div>
            <button className="button primary submit-wide" type="submit"><Save size={14} aria-hidden="true" /> Save app update</button>
          </form>}
        </div>
        <aside className="settings-aside">
          <div className="panel settings-info">
            <div className="info-icon"><ExternalLink size={17} aria-hidden="true" /></div>
            <h3>App update API</h3>
            <p>Flutter can request the public endpoint <code>/api/app-update</code>. It returns only the published update fields, not admin settings or credentials.</p>
            <a className="button" href="/api/app-update" target="_blank" rel="noreferrer">Preview API response <ExternalLink size={13} aria-hidden="true" /></a>
          </div>
          <div className="panel settings-warning">
            <div className="warning-title"><AlertTriangle size={15} aria-hidden="true" /> Important</div>
            <p>This admin setting publishes update metadata only. The Flutter app must compare version codes, show the notice, open the update link, and enforce the force-update behavior.</p>
          </div>
        </aside>
      </section>
    </AdminShell>
  );
}

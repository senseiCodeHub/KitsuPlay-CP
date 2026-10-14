import Link from "next/link";
import { ArrowLeft, Wrench, Save, AlertTriangle, ShieldCheck } from "lucide-react";
import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth/admin";
import { saveSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { supabase, admin } = await requireAdmin();
  const { data, error } = await supabase.from("app_settings").select("key,value").eq("key", "maintenance_mode").maybeSingle();
  const value = (data?.value ?? { enabled: false, message: "" }) as { enabled?: boolean; message?: string };

  return (
    <AdminShell active="settings">
      <header className="topbar">
        <div><div className="eyebrow">Configuration / Availability</div><h1>App settings</h1><p className="subtle">Manage operational settings for the KitsuPlay application.</p></div>
        <Link className="button" href="/"><ArrowLeft size={14} aria-hidden="true" /> Overview</Link>
      </header>

      {error && <div className="notice page-notice" role="alert">Settings could not be loaded. Apply the Supabase SQL migration and verify RLS.</div>}\n      {params.error && <div className="notice page-notice" role="alert">Settings could not be saved. Check the database policy and try again.</div>}\n      {params.saved && <div className="success-banner"><span className="dot" /> Settings saved successfully.</div>}

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
          </form>
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
    </AdminShell>
  );
}

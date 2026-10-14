"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Keep the UI stable; production errors are intentionally not rendered to users.
  }, []);

  return (
    <main className="login-wrap">
      <section className="panel login-card error-card" role="alert">
        <div className="section-icon"><AlertTriangle size={18} aria-hidden="true" /></div>
        <div className="eyebrow">Something needs attention</div>
        <h1>We couldn’t load this page.</h1>
        <p className="subtle">Your session and data have not been changed. Try loading this section again. If the problem continues, check the deployment and Supabase logs.</p>
        <button className="button primary" type="button" onClick={() => reset()}><RefreshCw size={14} aria-hidden="true" /> Try again</button>
      </section>
      <div className="login-page-footer"><span>KITSUPLAY / CONTROL PANEL</span><span>Recoverable error · No sensitive details shown</span></div>
    </main>
  );
}

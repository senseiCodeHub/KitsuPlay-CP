import { ShieldCheck, ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "./actions";

const messages: Record<string, string> = {
  missing: "Enter both email and password.",
  credentials: "Email or password is incorrect.",
  notadmin: "This account does not have active admin access.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <main className="login-wrap">
      <section className="panel login-card">
        <div className="login-topline"><span className="login-security"><ShieldCheck size={13} aria-hidden="true" /> PRIVATE ADMIN AREA</span><span className="login-version">KP / 01</span></div>
        <div className="brand login-brand"><span className="brand-mark">K</span><span>KitsuPlay <span className="brand-suffix">CP</span></span></div>
        <div className="eyebrow">Administrator authentication</div>
        <h1>Sign in to continue.</h1>
        <p className="subtle">Use your authorized administrator account to manage the KitsuPlay application.</p>
        {error && messages[error] && <p className="error login-error" role="alert">{messages[error]}</p>}
        <form className="form login-form" action={signIn}>
          <label className="label">Email address<input className="field" type="email" name="email" autoComplete="username" placeholder="admin@example.com" required /></label>
          <label className="label">Password<input className="field" type="password" name="password" autoComplete="current-password" placeholder="Enter your password" required /></label>
          <button className="button primary" type="submit">Continue to dashboard <ArrowRight size={15} aria-hidden="true" /></button>
        </form>
        <div className="login-footnote"><LockKeyhole size={13} aria-hidden="true" /><span>Public registration is disabled. Access is granted explicitly through Supabase admin roles.</span></div>
      </section>
      <div className="login-page-footer"><span>KITSUPLAY / CONTROL PANEL</span><span>Secure by role · Powered by Supabase Auth</span></div>
    </main>
  );
}

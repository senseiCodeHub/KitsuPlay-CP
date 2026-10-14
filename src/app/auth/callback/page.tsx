"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CircleAlert, LoaderCircle, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type ResultState = "loading" | "success" | "error";

export default function AuthCallbackPage() {
  const [state, setState] = useState<ResultState>("loading");
  const [message, setMessage] = useState("Checking your email verification link…");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function completeVerification() {
      try {
        const supabase = createClient();
        const url = new URL(window.location.href);
        const providerError = url.searchParams.get("error_description") ?? url.searchParams.get("error");
        if (providerError) throw new Error("This verification link is invalid, expired, or has already been used.");

        const tokenHash = url.searchParams.get("token_hash");
        const rawType = url.searchParams.get("type");
        const code = url.searchParams.get("code");
        const allowedTypes = ["signup", "invite", "magiclink", "recovery", "email_change", "email", "sms", "phone_change", "whatsapp"];
        const type = rawType && allowedTypes.includes(rawType) ? rawType as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email" | "sms" | "phone_change" | "whatsapp" : null;

        if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
          if (error) throw error;
        } else if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
          const accessToken = hash.get("access_token");
          const refreshToken = hash.get("refresh_token");
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
            if (error) throw error;
          }
        }

        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          throw new Error("We could not confirm this session. Request a fresh verification email and open its link again.");
        }
        if (!data.user.email_confirmed_at) {
          throw new Error("Supabase has not marked this email as verified yet. Request a fresh email and try again.");
        }

        if (active) {
          setEmail(data.user.email ?? null);
          setMessage("Your email address is verified. You can return to KitsuPlay and sign in with your email code.");
          setState("success");
        }
      } catch {
        if (active) {
          setMessage("This link could not be completed. It may have expired or already been used. Request a new email verification link, then try again.");
          setState("error");
        }
      }
    }

    void completeVerification();
    return () => { active = false; };
  }, []);

  const isSuccess = state === "success";

  return (
    <main className="login-wrap">
      <section className="panel login-card" aria-live="polite">
        <div className="login-topline"><span className="login-security"><ShieldCheck size={13} aria-hidden="true" /> KITSUPLAY ACCOUNT</span><span className="login-version">AUTH / 01</span></div>
        <div className="brand login-brand"><span className="brand-mark">K</span><span>KitsuPlay <span className="brand-suffix">CP</span></span></div>
        <div className="eyebrow" style={{ marginTop: 35 }}>Email verification</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18 }}>
          {state === "loading" ? <LoaderCircle size={30} className="verification-spinner" aria-hidden="true" /> : isSuccess ? <CheckCircle2 size={30} color="var(--accent)" aria-hidden="true" /> : <CircleAlert size={30} color="var(--danger)" aria-hidden="true" />}
          <h1 style={{ fontSize: 27, margin: 0 }}>{state === "loading" ? "Verifying email…" : isSuccess ? "Email verified" : "Verification failed"}</h1>
        </div>
        <p className="subtle" style={{ marginTop: 14 }}>{message}</p>
        {email && <p className="verification-email">{email}</p>}
        {state === "error" && <p className="error" role="alert">For safety, this page never marks an account verified by itself. Supabase must confirm the email token first.</p>}
        <div style={{ display: "grid", gap: 9, marginTop: 25 }}>
          <Link className="button primary" href="https://kitsu-play-cp.vercel.app/login">{isSuccess ? "Admin sign-in" : "Open control panel"}</Link>
          <a className="button" href="https://kitsu-play-cp.vercel.app/users">View user status (admin access required)</a>
        </div>
        <p className="verification-footnote">Verification is handled by Supabase Auth. The control panel only displays the confirmation status returned by Supabase.</p>
      </section>
      <div className="login-page-footer"><span>KITSUPLAY / CONTROL PANEL</span><span>Secure email confirmation · Supabase Auth</span></div>
    </main>
  );
}

import Link from "next/link";
import { LayoutDashboard, UsersRound, Megaphone, SlidersHorizontal, ScrollText, ShieldCheck, Activity, UserCog } from "lucide-react";
import type { ReactNode } from "react";

type AdminSection = "overview" | "users" | "announcements" | "settings" | "audit-log" | "analytics" | "admins" | "system-health";

const navigation: { id: AdminSection; label: string; href: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", href: "/", icon: LayoutDashboard },
  { id: "users", label: "Users", href: "/users", icon: UsersRound },
  { id: "announcements", label: "Announcements", href: "/announcements", icon: Megaphone },
  { id: "settings", label: "App settings", href: "/settings", icon: SlidersHorizontal },
  { id: "audit-log", label: "Audit log", href: "/audit-log", icon: ScrollText },
  { id: "analytics", label: "Analytics", href: "/analytics", icon: Activity },
  { id: "admins", label: "Admin access", href: "/admins", icon: UserCog },
  { id: "system-health", label: "System health", href: "/system-health", icon: Activity },
];

export function AdminShell({ active, children }: { active: AdminSection; children: ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/" aria-label="KitsuPlay Control Panel home">
          <span className="brand-mark">K</span>
          <span>KitsuPlay <span className="brand-suffix">CP</span></span>
        </Link>
        <nav className="nav" aria-label="Main navigation">
          {navigation.map(({ id, label, href, icon: Icon }) => (
            <Link key={id} href={href} className={active === id ? "active" : undefined} aria-current={active === id ? "page" : undefined}>
              <Icon className="nav-icon" size={16} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="sidebar-note-heading"><ShieldCheck size={14} aria-hidden="true" /> Secure workspace</div>
          Privileged actions are verified on the server. Access is controlled by Supabase admin roles.
        </div>
        <div className="sidebar-footer"><span className="sidebar-footer-dot" /> KITSUPLAY CONTROL PANEL <span>v1.0</span></div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}

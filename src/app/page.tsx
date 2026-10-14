import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { signOut } from "@/app/signout/actions";
export const dynamic="force-dynamic";
export default async function DashboardPage(){
 const {supabase,user,admin}=await requireAdmin();
 const [profiles,watchlist,progress,announcements]=await Promise.all([
  supabase.from("profiles").select("id",{count:"exact",head:true}),
  supabase.from("watchlist").select("user_id",{count:"exact",head:true}),
  supabase.from("watch_progress").select("user_id",{count:"exact",head:true}),
  supabase.from("app_announcements").select("id",{count:"exact",head:true}).eq("is_active",true)
 ]);
 const cards=[{label:"Registered profiles",value:profiles.count,foot:"Profiles table"},{label:"Watchlist records",value:watchlist.count,foot:"Saved titles"},{label:"Progress records",value:progress.count,foot:"Watch history sync"},{label:"Active announcements",value:announcements.count,foot:"App messages"}];
 const hasErrors=[profiles,watchlist,progress,announcements].some(x=>x.error);
 return <div className="shell"><aside className="sidebar"><Link className="brand" href="/"><span className="brand-mark">K</span><span>KitsuPlay <span style={{color:"#91a8ff"}}>CP</span></span></Link><nav className="nav"><Link className="active" href="/">Overview</Link><Link href="/users">Users</Link><Link href="/announcements">Announcements</Link><Link href="/settings">App settings</Link><Link href="/audit-log">Audit log</Link></nav><div className="sidebar-note"><strong style={{color:"#e9f0ff"}}>Admin access</strong><br/>Privileged actions are checked server-side against the admin_users table.</div></aside>
 <main className="main"><header className="topbar"><div><div className="eyebrow">Control center</div><h1>Overview</h1><p className="subtle">Monitor KitsuPlay from one secure workspace.</p></div><form action={signOut}><button className="button" type="submit">Sign out</button></form></header>
 {hasErrors&&<div className="notice" style={{marginBottom:18}}>Some metrics could not load. Apply the Supabase migration and confirm that existing app table names and policies match.</div>}
 <section className="stats">{cards.map(card=><div className="panel" key={card.label}><div className="stat-label">{card.label}</div><div className="stat-value">{card.value??"—"}</div><div className="stat-foot">{card.foot}</div></div>)}</section>
 <section className="content-grid"><div className="panel"><div className="panel-title">Admin workspace <span className="pill"><span className="dot"/>Protected</span></div>
 {[
 ["User management","Search accounts, inspect profiles and manage access.","/users"],
 ["Announcements","Publish maintenance notices and app messages.","/announcements"],
 ["App settings","Manage maintenance mode and app configuration.","/settings"],
 ["Audit log","Review administrative actions.","/audit-log"]
 ].map(([title,desc,href])=><div className="row-item" key={title}><div><div className="row-title">{title}</div><div className="row-meta">{desc}</div></div><Link className="button" href={href}>Open</Link></div>)}
 </div><div className="panel"><div className="panel-title">Session details</div><div className="row-item"><div><div className="row-title">Signed in as</div><div className="row-meta">{user.email??user.id}</div></div></div><div className="row-item"><div><div className="row-title">Admin role</div><div className="row-meta">{admin.role}</div></div><span className="pill">Active</span></div><div className="row-item"><div><div className="row-title">Authentication</div><div className="row-meta">Supabase Auth session</div></div><span className="pill">Verified session</span></div></div></section></main></div>;
}
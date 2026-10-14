import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";
const csv = (value: unknown) => {
  const text = String(value ?? "").replace(/[\r\n]+/g, " ");
  const safe = /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
  return '"' + safe.replace(/"/g, '""') + '"';
};

export async function GET() {
  const { supabase, admin, user } = await requireAdmin();
  if (!["owner", "admin"].includes(admin.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { data, error } = await supabase.from("admin_audit_log").select("id,actor_id,action,target_type,target_id,details,created_at").order("created_at", { ascending: false }).limit(10000);
  if (error) return NextResponse.json({ error: "Could not export audit history." }, { status: 503 });
  const header = ["id", "actor_id", "action", "target_type", "target_id", "details", "created_at"];
  const rows = (data ?? []).map((item) => header.map((key) => key === "details" ? JSON.stringify(item.details ?? {}) : item[key as keyof typeof item]));
  const body = [header, ...rows].map((row) => row.map(csv).join(",")).join("\r\n");
  await supabase.from("admin_audit_log").insert({ actor_id: user.id, action: "audit.export", target_type: "admin_audit_log", details: { rows: data?.length ?? 0 } });
  return new NextResponse("\uFEFF" + body + "\r\n", { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="kitsuplay-audit-log.csv"', "Cache-Control": "no-store" } });
}

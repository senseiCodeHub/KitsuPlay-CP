import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
const csv = (value: unknown) => '"' + String(value ?? "").replace(/"/g, '""').replace(/[\r\n]+/g, " ") + '"';

export async function GET() {
  const { admin, supabase, user } = await requireAdmin();
  if (!["owner", "admin"].includes(admin.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const client = createAdminClient();
    const users: { id: string; email: string; created_at: string; email_confirmed_at: string; last_sign_in_at: string; banned_until: string }[] = [];
    let truncated = false;
    for (let page = 1; page <= 100; page++) {
      const result = await client.auth.admin.listUsers({ page, perPage: 100 });
      if (result.error) return NextResponse.json({ error: "Could not export Auth users." }, { status: 503 });
      users.push(...result.data.users.map((u) => ({ id: u.id, email: u.email ?? "", created_at: u.created_at ?? "", email_confirmed_at: u.email_confirmed_at ?? "", last_sign_in_at: u.last_sign_in_at ?? "", banned_until: u.banned_until ?? "" })));
      if (result.data.users.length < 100) break;
      if (page === 100) truncated = true;
    }
    const header = ["id", "email", "created_at", "email_confirmed_at", "last_sign_in_at", "banned_until"];
    const body = [header, ...users.map((u) => header.map((key) => u[key as keyof typeof u]))].map((row) => row.map(csv).join(",")).join("\r\n");
    const { data: actor } = await client.auth.getUser();
    void actor;
    return new NextResponse("\uFEFF" + body + "\r\n", { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="kitsuplay-users.csv"', "Cache-Control": "no-store", "X-Export-Truncated": String(truncated) } });
  } catch { return NextResponse.json({ error: "User export is not configured. Check the server-only Supabase secret." }, { status: 503 }); }
}

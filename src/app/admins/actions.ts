"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveAdminRole(formData: FormData) {
  const { user, admin } = await requireAdmin();
  if (admin.role !== "owner") redirect("/unauthorized?reason=owner");
  const userId = String(formData.get("user_id") ?? "");
  const role = String(formData.get("role") ?? "");
  const active = formData.get("is_active") === "on";
  if (!/^[0-9a-f-]{36}$/i.test(userId) || !["owner", "admin", "support"].includes(role)) redirect("/admins?error=invalid");
  let client: ReturnType<typeof createAdminClient>;
  try { client = createAdminClient(); } catch { redirect("/admins?error=config"); }
  const { data: target } = await client.from("admin_users").select("user_id,role,is_active").eq("user_id", userId).maybeSingle();
  if (userId === user.id && (!active || role !== "owner")) redirect("/admins?error=self");
  if (target?.role === "owner" && (role !== "owner" || !active)) {
    const { count } = await client.from("admin_users").select("user_id", { count: "exact", head: true }).eq("role", "owner").eq("is_active", true);
    if ((count ?? 0) <= 1) redirect("/admins?error=lastowner");
  }
  const { error } = await client.from("admin_users").upsert({ user_id: userId, role, is_active: active, created_by: target ? undefined : user.id }, { onConflict: "user_id" });
  if (error) redirect("/admins?error=save");
  await client.from("admin_audit_log").insert({ actor_id: user.id, action: target ? "admin.role.update" : "admin.role.grant", target_type: "admin_user", target_id: userId, details: { role, is_active: active } });
  revalidatePath("/admins");
  revalidatePath("/");
  redirect("/admins?updated=1");
}

export async function removeAdminAccess(formData: FormData) {
  const { user, admin } = await requireAdmin();
  if (admin.role !== "owner") redirect("/unauthorized?reason=owner");
  const userId = String(formData.get("user_id") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(userId)) redirect("/admins?error=invalid");
  if (userId === user.id) redirect("/admins?error=self");
  let client: ReturnType<typeof createAdminClient>;
  try { client = createAdminClient(); } catch { redirect("/admins?error=config"); }
  const { data: target } = await client.from("admin_users").select("user_id,role,is_active").eq("user_id", userId).maybeSingle();
  if (!target) redirect("/admins?error=invalid");
  if (target.role === "owner" && target.is_active) {
    const { count } = await client.from("admin_users").select("user_id", { count: "exact", head: true }).eq("role", "owner").eq("is_active", true);
    if ((count ?? 0) <= 1) redirect("/admins?error=lastowner");
  }
  const { error } = await client.from("admin_users").delete().eq("user_id", userId);
  if (error) redirect("/admins?error=save");
  await client.from("admin_audit_log").insert({ actor_id: user.id, action: "admin.role.revoke", target_type: "admin_user", target_id: userId });
  revalidatePath("/admins");
  revalidatePath("/");
  redirect("/admins?updated=1");
}

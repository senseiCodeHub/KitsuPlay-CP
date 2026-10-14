"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";

export async function saveSettings(formData: FormData) {
  const { supabase, user, admin } = await requireAdmin();
  if (admin.role === "support") redirect("/unauthorized");
  const enabled = formData.get("enabled") === "on";
  const message = String(formData.get("message") ?? "").trim().slice(0, 1000);
  const { error } = await supabase.from("app_settings").upsert({
    key: "maintenance_mode", value: { enabled, message }, updated_at: new Date().toISOString(), updated_by: user.id,
  }, { onConflict: "key" });
  if (error) redirect("/settings?error=save");
  await supabase.from("admin_audit_log").insert({ actor_id: user.id, action: "settings.maintenance.update", target_type: "app_settings", target_id: "maintenance_mode", details: { enabled } });
  revalidatePath("/settings"); revalidatePath("/"); redirect("/settings?saved=1");
}

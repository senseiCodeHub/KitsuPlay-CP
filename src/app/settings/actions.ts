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

export async function saveAppUpdateSettings(formData: FormData) {
  const { supabase, user, admin } = await requireAdmin();
  if (admin.role === "support") redirect("/unauthorized");

  const enabled = formData.get("enabled") === "on";
  const forceUpdate = formData.get("force_update") === "on";
  const latestVersion = String(formData.get("latest_version") ?? "").trim().slice(0, 30);
  const versionCodeRaw = String(formData.get("latest_version_code") ?? "").trim();
  const versionCode = Number(versionCodeRaw);
  const title = String(formData.get("title") ?? "").trim().slice(0, 120);
  const message = String(formData.get("message") ?? "").trim().slice(0, 1000);
  const updateUrl = String(formData.get("update_url") ?? "").trim().slice(0, 2048);

  let parsedUrl: URL;
  try { parsedUrl = new URL(updateUrl); } catch { redirect("/settings?error=update_invalid"); }
  if (
    !/^\d+(?:\.\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(latestVersion) ||
    !Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2147483647 ||
    !title || !message || parsedUrl!.protocol !== "https:" || parsedUrl!.username || parsedUrl!.password
  ) redirect("/settings?error=update_invalid");

  const config = {
    enabled,
    latest_version: latestVersion,
    latest_version_code: versionCode,
    title,
    message,
    force_update: forceUpdate,
    update_url: parsedUrl!.toString(),
  };
  const { error } = await supabase.from("app_settings").upsert({
    key: "app_update_config", value: config, updated_at: new Date().toISOString(), updated_by: user.id,
  }, { onConflict: "key" });
  if (error) redirect("/settings?error=save");
  await supabase.from("admin_audit_log").insert({
    actor_id: user.id,
    action: "settings.app_update.update",
    target_type: "app_settings",
    target_id: "app_update_config",
    details: { enabled, latest_version: latestVersion, latest_version_code: versionCode, force_update: forceUpdate, update_url: parsedUrl!.origin },
  });
  revalidatePath("/settings");
  revalidatePath("/");
  redirect("/settings?update_saved=1");
}

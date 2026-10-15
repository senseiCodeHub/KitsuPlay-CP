"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const id = String(formData.get("id") ?? "").trim();
  const isActive = formData.get("is_active") === "on";
  const forceUpdate = formData.get("force_update") === "on";
  const version = String(formData.get("version") ?? "").trim().slice(0, 32);
  const versionCodeRaw = String(formData.get("version_code") ?? "").trim();
  const versionCode = Number(versionCodeRaw);
  const title = String(formData.get("title") ?? "").trim().slice(0, 160);
  const body = String(formData.get("body") ?? "").trim().slice(0, 8000);
  const downloadUrl = String(formData.get("download_url") ?? "").trim().slice(0, 2048);
  const startsAtRaw = String(formData.get("starts_at") ?? "").trim();
  const endsAtRaw = String(formData.get("ends_at") ?? "").trim();

  let parsedUrl: URL;
  try { parsedUrl = new URL(downloadUrl); } catch { redirect("/settings?error=update_invalid"); }

  const startsAt = startsAtRaw ? new Date(`${startsAtRaw}:00Z`) : null;
  const endsAt = endsAtRaw ? new Date(`${endsAtRaw}:00Z`) : null;
  if (
    !/^\d+(?:\.\d+){1,3}(?:[-+][0-9A-Za-z.-]+)?$/.test(version) ||
    !Number.isSafeInteger(versionCode) || versionCode < 1 || versionCode > 2147483647 ||
    !title || !body || parsedUrl!.protocol !== "https:" || parsedUrl!.username || parsedUrl!.password ||
    (startsAtRaw && Number.isNaN(startsAt!.getTime())) ||
    (endsAtRaw && Number.isNaN(endsAt!.getTime())) ||
    (startsAt && endsAt && startsAt >= endsAt)
  ) redirect("/settings?error=update_invalid");

  const client = createAdminClient();
  const payload = {
    version,
    version_code: versionCode,
    title,
    body,
    download_url: parsedUrl!.toString(),
    force_update: forceUpdate,
    is_active: isActive,
    starts_at: startsAt ? startsAt.toISOString() : null,
    ends_at: endsAt ? endsAt.toISOString() : null,
    created_by: user.id,
  };

  // The table intentionally exposes active releases to clients but does not grant
  // browser-admin write access. All writes therefore use the server-only client,
  // after requireAdmin verifies the signed-in user's active admin role.
  if (isActive) {
    const { error: deactivateError } = await client
      .from("app_updates")
      .update({ is_active: false })
      .neq("id", id || "00000000-0000-0000-0000-000000000000");
    if (deactivateError) redirect("/settings?error=save");
  }

  let saveError;
  if (id) {
    const { error } = await client.from("app_updates").update(payload).eq("id", id);
    saveError = error;
  } else {
    const { error } = await client.from("app_updates").insert(payload);
    saveError = error;
  }
  if (saveError) redirect("/settings?error=save");

  await supabase.from("admin_audit_log").insert({
    actor_id: user.id,
    action: "settings.app_update.release",
    target_type: "app_updates",
    target_id: id || version,
    details: { version, version_code: versionCode, is_active: isActive, force_update: forceUpdate, download_origin: parsedUrl!.origin },
  });

  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/api/app-update");
  redirect("/settings?update_saved=1");
}

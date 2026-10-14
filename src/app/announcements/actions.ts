"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";

function parseSchedule(value: FormDataEntryValue | null): string | null | false {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return false;
  return date.toISOString();
}

export async function createAnnouncement(formData: FormData) {
  const { supabase, user, admin } = await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const kind = String(formData.get("kind") ?? "info");
  const startsAt = parseSchedule(formData.get("starts_at"));
  const endsAt = parseSchedule(formData.get("ends_at"));
  if (title.length < 1 || title.length > 120 || body.length < 1 || body.length > 5000 ||
      !["info", "success", "warning", "maintenance"].includes(kind) ||
      startsAt === false || endsAt === false ||
      (startsAt && endsAt && new Date(endsAt).getTime() <= new Date(startsAt).getTime())) {
    redirect("/announcements?error=invalid");
  }
  if (admin.role === "support") redirect("/unauthorized");
  const isActive = formData.get("is_active") === "on";
  const { data, error } = await supabase.from("app_announcements").insert({
    title, body, kind, is_active: isActive, starts_at: startsAt, ends_at: endsAt, created_by: user.id,
  }).select("id").single();
  if (error) redirect("/announcements?error=save");
  await supabase.from("admin_audit_log").insert({
    actor_id: user.id, action: "announcement.create", target_type: "announcement",
    target_id: data.id, details: { title, kind, is_active: isActive, starts_at: startsAt, ends_at: endsAt },
  });
  revalidatePath("/announcements"); revalidatePath("/"); revalidatePath("/analytics");
  redirect("/announcements?created=1");
}

export async function toggleAnnouncement(formData: FormData) {
  const { supabase, user, admin } = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const next = formData.get("active") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(id)) redirect("/announcements?error=invalid");
  if (admin.role === "support") redirect("/unauthorized");
  const { error } = await supabase.from("app_announcements").update({ is_active: next }).eq("id", id);
  if (error) redirect("/announcements?error=save");
  await supabase.from("admin_audit_log").insert({
    actor_id: user.id, action: next ? "announcement.activate" : "announcement.deactivate",
    target_type: "announcement", target_id: id,
  });
  revalidatePath("/announcements"); revalidatePath("/");
  redirect("/announcements?updated=1");
}

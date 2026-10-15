import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const headers = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  try {
    const client = createAdminClient();
    const { data, error } = await client
      .from("app_updates")
      .select("id,version,version_code,title,body,download_url,force_update,is_active,starts_at,ends_at,created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: "update_config_unavailable" }, { status: 503, headers });
    }

    const now = Date.now();
    const release = (data ?? []).find((item) => {
      const startsAt = item.starts_at ? new Date(item.starts_at).getTime() : null;
      const endsAt = item.ends_at ? new Date(item.ends_at).getTime() : null;
      return (startsAt === null || (Number.isFinite(startsAt) && startsAt <= now)) &&
        (endsAt === null || (Number.isFinite(endsAt) && endsAt >= now));
    });

    let updateUrl = "";
    if (release && typeof release.download_url === "string") {
      try {
        const parsed = new URL(release.download_url);
        if (parsed.protocol === "https:" && !parsed.username && !parsed.password) {
          updateUrl = parsed.toString();
        }
      } catch {
        // Invalid URLs are never sent to the client.
      }
    }

    return NextResponse.json({
      enabled: Boolean(release),
      latest_version: release?.version ?? "",
      latest_version_code: Number.isSafeInteger(release?.version_code) && Number(release?.version_code) > 0
        ? Number(release?.version_code)
        : 0,
      title: release?.title ?? "",
      message: release?.body ?? "",
      force_update: Boolean(release?.force_update),
      update_url: updateUrl,
      updated_at: release?.created_at ?? null,
    }, { headers });
  } catch {
    return NextResponse.json({ error: "update_config_unavailable" }, { status: 503, headers });
  }
}

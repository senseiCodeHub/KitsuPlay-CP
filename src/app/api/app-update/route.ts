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
      .from("app_settings")
      .select("value,updated_at")
      .eq("key", "app_update_config")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "update_config_unavailable" }, { status: 503, headers });
    }

    const value = (data?.value ?? {}) as Record<string, unknown>;
    const candidateUrl = typeof value.update_url === "string" ? value.update_url : "";
    let updateUrl = "";
    try {
      const parsed = new URL(candidateUrl);
      if (parsed.protocol === "https:" && !parsed.username && !parsed.password) {
        updateUrl = parsed.toString();
      }
    } catch {
      // Ignore malformed URLs in stored configuration.
    }

    return NextResponse.json({
      enabled: value.enabled === true,
      latest_version: typeof value.latest_version === "string" ? value.latest_version : "",
      latest_version_code: Number.isSafeInteger(value.latest_version_code) && Number(value.latest_version_code) > 0
        ? Number(value.latest_version_code)
        : 0,
      title: typeof value.title === "string" ? value.title : "",
      message: typeof value.message === "string" ? value.message : "",
      force_update: value.force_update === true,
      update_url: updateUrl,
      updated_at: typeof data?.updated_at === "string" ? data.updated_at : null,
    }, { headers });
  } catch {
    return NextResponse.json({ error: "update_config_unavailable" }, { status: 503, headers });
  }
}

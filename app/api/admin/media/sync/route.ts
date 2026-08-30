import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { syncStreamerMetrics } from "@/lib/streamer-metrics";
import { NextResponse } from "next/server";

export async function POST() {
  const admin = await requireAdminCapability("STREAMERS");
  if (!admin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  try {
    const result = await syncStreamerMetrics();
    await createAdminLog({ action: "STREAMER_METRICS_SYNC", title: "تحديث إحصائيات الستريمرز", details: `${result.statuses.filter((item) => item.isLive).length} مباشر الآن`, adminDiscordId: admin.id, targetType: "MEDIA" });
    return NextResponse.json({ success: true, ...result });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "فشل مزامنة Kick" }, { status: 400 }); }
}

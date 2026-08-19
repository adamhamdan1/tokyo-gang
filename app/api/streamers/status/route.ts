import { getKickChannelStatuses, isKickStatusConfigured } from "@/lib/kick";
import { prisma } from "@/lib/prisma";
import { parseStoredSiteContent } from "@/lib/site-content";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function kickSlug(url: string, handle: string) {
  try {
    const pathname = new URL(url).pathname.split("/").filter(Boolean)[0];
    if (pathname) return pathname.toLowerCase();
  } catch {
    // The handle fallback below keeps old CMS content compatible.
  }
  return handle.replace(/^@/, "").trim().toLowerCase();
}

export async function GET() {
  const configured = isKickStatusConfigured();
  if (!configured) {
    return NextResponse.json(
      { configured: false, statuses: [], syncedAt: null },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  }

  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: "siteContentV2" }, select: { value: true } });
    const content = parseStoredSiteContent(setting?.value);
    const slugs = content.streamers.filter((streamer) => streamer.visible).map((streamer) => kickSlug(streamer.kick, streamer.handle));
    const statuses = await getKickChannelStatuses(slugs);
    return NextResponse.json(
      { configured: true, statuses, syncedAt: new Date().toISOString() },
      { headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=180" } }
    );
  } catch (error) {
    console.error("Kick live status sync failed", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { configured: true, statuses: [], syncedAt: null, temporarilyUnavailable: true },
      { headers: { "Cache-Control": "public, s-maxage=20, stale-while-revalidate=60" } }
    );
  }
}

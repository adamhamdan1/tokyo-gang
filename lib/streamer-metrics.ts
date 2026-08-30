import "server-only";

import { ensureCommandSchema } from "@/lib/command-schema";
import { getKickChannelStatuses } from "@/lib/kick";
import { prisma } from "@/lib/prisma";
import { parseStoredSiteContent } from "@/lib/site-content";

function slugFrom(url: string, handle: string) {
  try { return new URL(url).pathname.split("/").filter(Boolean)[0]?.toLowerCase() || handle.replace(/^@/, "").toLowerCase(); }
  catch { return handle.replace(/^@/, "").toLowerCase(); }
}

export async function syncStreamerMetrics() {
  await ensureCommandSchema();
  const setting = await prisma.siteSetting.findUnique({ where: { key: "siteContentV2" }, select: { value: true } });
  const content = parseStoredSiteContent(setting?.value);
  const roster = content.streamers.filter((streamer) => streamer.visible).map((streamer) => ({ ...streamer, slug: slugFrom(streamer.kick, streamer.handle) }));
  const statuses = await getKickChannelStatuses(roster.map((item) => item.slug));
  const bySlug = new Map(statuses.map((status) => [status.slug, status]));
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const metrics = [];
  for (const streamer of roster) {
    const status = bySlug.get(streamer.slug);
    const current = await prisma.streamerMetric.findUnique({ where: { slug_date: { slug: streamer.slug, date } } });
    const live = Boolean(status?.isLive);
    const elapsed = current && current.wasLive && live ? Math.min(10, Math.max(0, Math.round((now.getTime() - current.lastObservedAt.getTime()) / 60_000))) : 0;
    metrics.push(await prisma.streamerMetric.upsert({
      where: { slug_date: { slug: streamer.slug, date } },
      update: { streamerName: streamer.name, maxViewers: Math.max(current?.maxViewers ?? 0, status?.viewers ?? 0), liveMinutes: { increment: elapsed }, streamCount: { increment: live && !current?.wasLive ? 1 : 0 }, wasLive: live, lastLiveAt: live ? now : current?.lastLiveAt, lastObservedAt: now },
      create: { slug: streamer.slug, streamerName: streamer.name, date, maxViewers: status?.viewers ?? 0, liveMinutes: 0, streamCount: live ? 1 : 0, wasLive: live, lastLiveAt: live ? now : null, lastObservedAt: now },
    }));
  }
  return { statuses, metrics, syncedAt: now };
}

import { getAdminContext } from "@/lib/admin-permissions";
import { ensureCommandSchema } from "@/lib/command-schema";
import { getKickChannelStatuses } from "@/lib/kick";
import { prisma } from "@/lib/prisma";
import { parseStoredSiteContent } from "@/lib/site-content";
import Link from "next/link";
import { AdminMediaCenter } from "../AdminMediaCenter";

function slugFrom(url: string, handle: string) { try { return new URL(url).pathname.split("/").filter(Boolean)[0]?.toLowerCase() || handle.replace(/^@/, "").toLowerCase(); } catch { return handle.replace(/^@/, "").toLowerCase(); } }

export default async function AdminMediaPage() {
  const admin = await getAdminContext();
  if (!admin || (!admin.capabilities.ALL && !admin.capabilities.STREAMERS)) return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-black text-white"><h1 className="text-4xl font-black">ممنوع الدخول</h1></main>;
  await ensureCommandSchema();
  const setting = await prisma.siteSetting.findUnique({ where: { key: "siteContentV2" }, select: { value: true } });
  const content = parseStoredSiteContent(setting?.value);
  const streamers = content.streamers.filter((item) => item.visible).map((item) => ({ ...item, slug: slugFrom(item.kick, item.handle) }));
  const [statuses, metrics] = await Promise.all([getKickChannelStatuses(streamers.map((item) => item.slug)).catch(() => []), prisma.streamerMetric.findMany({ where: { slug: { in: streamers.map((item) => item.slug) } }, orderBy: { date: "desc" }, take: 210 })]);
  return <main dir="rtl" className="tokyo-dashboard min-h-screen px-3 py-5 text-white sm:px-5 md:p-10"><div className="mx-auto max-w-7xl"><Link href="/admin" className="mb-5 inline-flex rounded-2xl border border-white/15 bg-black/60 px-5 py-3 text-sm font-black text-zinc-300">الرجوع للإدارة</Link><AdminMediaCenter streamers={streamers} statuses={statuses} metrics={metrics.map((item) => ({ ...item, lastLiveAt: item.lastLiveAt?.toISOString() ?? null, lastObservedAt: item.lastObservedAt.toISOString(), createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() }))}/></div></main>;
}

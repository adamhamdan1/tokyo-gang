import { createAdminLog } from "@/lib/admin-log";
import { getAdminContext } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { validateJsonWriteRequest } from "@/lib/request-security";
import { normalizeSiteContent } from "@/lib/site-content";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SAFE_SETTING_KEYS = new Set([
  "siteContentV2",
  "tokyoDiscordRoleOverrides",
  "tokyoApplicationWebhookChannelId",
  "tokyoAdminLogWebhookChannelId",
  "spotlightMemberId",
  "honorEliteMemberId",
  "honorPlayerMemberId",
  "honorStreamerMemberId",
  "honorRecentMemberId",
]);

type BackupSetting = { key: string; value: string };
type BackupAnnouncement = { title: string; message: string; active: boolean };
type BackupAlert = { title: string; message: string; active: boolean; expiresAt: string | null };

type TokyoBackup = {
  version: 1;
  generatedAt: string;
  settings: BackupSetting[];
  announcements: BackupAnnouncement[];
  alerts: BackupAlert[];
};

function cleanBackup(value: unknown): TokyoBackup | null {
  if (!value || typeof value !== "object") return null;
  const source = value as Partial<TokyoBackup>;
  if (source.version !== 1 || !Array.isArray(source.settings) || !Array.isArray(source.announcements) || !Array.isArray(source.alerts)) return null;

  const settings = source.settings
    .filter((item): item is BackupSetting => Boolean(item && typeof item.key === "string" && typeof item.value === "string" && SAFE_SETTING_KEYS.has(item.key) && item.value.length <= 120_000))
    .slice(0, SAFE_SETTING_KEYS.size);
  const announcements = source.announcements
    .filter((item): item is BackupAnnouncement => Boolean(item && typeof item.title === "string" && typeof item.message === "string" && typeof item.active === "boolean" && item.title.trim() && item.message.trim()))
    .map((item) => ({ title: item.title.trim().slice(0, 140), message: item.message.trim().slice(0, 2000), active: item.active }))
    .slice(0, 100);
  const alerts = source.alerts
    .filter((item): item is BackupAlert => Boolean(item && typeof item.title === "string" && typeof item.message === "string" && typeof item.active === "boolean" && (item.expiresAt === null || typeof item.expiresAt === "string")))
    .map((item) => ({
      title: item.title.trim().slice(0, 140),
      message: item.message.trim().slice(0, 1000),
      active: item.active,
      expiresAt: item.expiresAt && !Number.isNaN(Date.parse(item.expiresAt)) ? new Date(item.expiresAt).toISOString() : null,
    }))
    .filter((item) => item.title && item.message)
    .slice(0, 100);

  return { version: 1, generatedAt: typeof source.generatedAt === "string" ? source.generatedAt : new Date().toISOString(), settings, announcements, alerts };
}

async function requireOwner() {
  const admin = await getAdminContext();
  return admin?.isOwner ? admin : null;
}

export async function GET() {
  const admin = await requireOwner();
  if (!admin) return NextResponse.json({ error: "هذه الأداة متاحة لمالك الموقع فقط" }, { status: 403 });

  const [settings, announcements, alerts] = await Promise.all([
    prisma.siteSetting.findMany({ where: { key: { in: [...SAFE_SETTING_KEYS] } }, select: { key: true, value: true } }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { title: true, message: true, active: true } }),
    prisma.siteAlert.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { title: true, message: true, active: true, expiresAt: true } }),
  ]);

  const backup = {
    version: 1 as const,
    generatedAt: new Date().toISOString(),
    metadata: {
      product: "TOKYO GANG Command Portal",
      secretsIncluded: false,
      adminPermissionsIncluded: false,
    },
    settings,
    announcements,
    alerts: alerts.map((alert) => ({ ...alert, expiresAt: alert.expiresAt?.toISOString() ?? null })),
  };
  const date = new Date().toISOString().slice(0, 10);

  await createAdminLog({
    action: "SAFE_BACKUP_EXPORT",
    title: "تصدير نسخة احتياطية آمنة",
    details: `${settings.length} إعدادات، ${announcements.length} إعلانات، ${alerts.length} تنبيهات — بدون أسرار`,
    adminDiscordId: admin.id,
    targetType: "SYSTEM_BACKUP",
  }).catch(() => null);

  return new NextResponse(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="tokyo-safe-backup-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const requestError = validateJsonWriteRequest(request, 300_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });

  const admin = await requireOwner();
  if (!admin) return NextResponse.json({ error: "هذه الأداة متاحة لمالك الموقع فقط" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { backup?: unknown } | null;
  const backup = cleanBackup(body?.backup);
  if (!backup) return NextResponse.json({ error: "ملف النسخة الاحتياطية غير صالح أو غير مدعوم" }, { status: 400 });

  let restoredSettings = 0;
  for (const setting of backup.settings) {
    let value = setting.value;
    if (setting.key === "siteContentV2") {
      try {
        value = JSON.stringify(normalizeSiteContent(JSON.parse(setting.value)));
      } catch {
        continue;
      }
    }
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: { value, updatedBy: admin.id },
      create: { key: setting.key, value, updatedBy: admin.id },
    });
    restoredSettings += 1;
  }

  let restoredAnnouncements = 0;
  for (const announcement of backup.announcements) {
    const existing = await prisma.announcement.findFirst({ where: { title: announcement.title, message: announcement.message } });
    if (existing) continue;
    await prisma.announcement.create({ data: { ...announcement, createdBy: admin.id } });
    restoredAnnouncements += 1;
  }

  let restoredAlerts = 0;
  for (const alert of backup.alerts) {
    const existing = await prisma.siteAlert.findFirst({ where: { title: alert.title, message: alert.message } });
    if (existing) continue;
    await prisma.siteAlert.create({
      data: { ...alert, expiresAt: alert.expiresAt ? new Date(alert.expiresAt) : null, createdBy: admin.id },
    });
    restoredAlerts += 1;
  }

  await createAdminLog({
    action: "SAFE_BACKUP_RESTORE",
    title: "استرجاع نسخة احتياطية آمنة",
    details: `${restoredSettings} إعدادات، ${restoredAnnouncements} إعلانات، ${restoredAlerts} تنبيهات`,
    adminDiscordId: admin.id,
    targetType: "SYSTEM_BACKUP",
  }).catch(() => null);

  return NextResponse.json({ success: true, restoredSettings, restoredAnnouncements, restoredAlerts });
}

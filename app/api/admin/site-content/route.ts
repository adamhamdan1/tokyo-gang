import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { normalizeSiteContent } from "@/lib/site-content";
import { NextResponse } from "next/server";
import { validateJsonWriteRequest } from "@/lib/request-security";

export async function PUT(request: Request) {
  const requestError = validateJsonWriteRequest(request, 120_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });

  const admin = await requireAdminCapability("LOGS");
  if (!admin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { content?: unknown } | null;
  if (!body?.content) return NextResponse.json({ error: "بيانات المحتوى غير صالحة" }, { status: 400 });

  const content = normalizeSiteContent(body.content);
  await prisma.siteSetting.upsert({
    where: { key: "siteContentV2" },
    update: { value: JSON.stringify(content), updatedBy: admin.id },
    create: { key: "siteContentV2", value: JSON.stringify(content), updatedBy: admin.id },
  });

  await createAdminLog({
    action: "SITE_CONTENT_PUBLISH",
    title: "نشر تحديث جديد لمحتوى الموقع",
    details: `${content.leadership.length} قيادة، ${content.streamers.length} ستريمر، ${content.wars.length} عملية`,
    adminDiscordId: admin.id,
    targetType: "SITE_CONTENT",
    targetId: "siteContentV2",
  }).catch(() => null);

  return NextResponse.json({ success: true, content });
}

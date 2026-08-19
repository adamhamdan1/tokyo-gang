import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AlertBody = {
  title?: string;
  message?: string;
  durationMinutes?: number;
};

export async function POST(req: Request) {
  const admin = await requireAdminCapability("LOGS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const body = (await req.json()) as AlertBody;
  const title = body.title?.trim();
  const message = body.message?.trim();

  if (!title || !message) {
    return NextResponse.json({ error: "اكتب عنوان وتنبيه" }, { status: 400 });
  }

  const duration = Math.max(5, Number(body.durationMinutes ?? 60));
  const alert = await prisma.siteAlert.create({
    data: {
      title,
      message,
      expiresAt: new Date(Date.now() + duration * 60 * 1000),
      createdBy: admin.id,
    },
  });

  await createAdminLog({
    action: "SITE_ALERT",
    title: `تنبيه موقع: ${title}`,
    details: message,
    adminDiscordId: admin.id,
    targetType: "SITE_ALERT",
    targetId: alert.id,
  }).catch(() => null);

  return NextResponse.json({ success: true, alert });
}

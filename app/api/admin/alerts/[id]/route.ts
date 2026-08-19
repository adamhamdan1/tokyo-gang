import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function DELETE(_req: Request, context: RouteContext) {
  const admin = await requireAdminCapability("LOGS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const alert = await prisma.siteAlert.findUnique({ where: { id } });

  if (!alert) {
    return NextResponse.json({ error: "التنبيه غير موجود" }, { status: 404 });
  }

  if (alert.active) {
    await prisma.siteAlert.update({
      where: { id },
      data: {
        active: false,
        expiresAt: new Date(),
      },
    });

    await createAdminLog({
      action: "SITE_ALERT_DISMISS",
      title: `إيقاف تنبيه الموقع: ${alert.title}`,
      details: alert.message,
      adminDiscordId: admin.id,
      targetType: "SITE_ALERT",
      targetId: alert.id,
    }).catch(() => null);
  }

  return NextResponse.json({ success: true });
}

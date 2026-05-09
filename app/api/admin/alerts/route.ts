import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AlertBody = {
  title?: string;
  message?: string;
  durationMinutes?: number;
};

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

export async function POST(req: Request) {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
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
      createdBy: session.user.id,
    },
  });

  await createAdminLog({
    action: "SITE_ALERT",
    title: `تنبيه موقع: ${title}`,
    details: message,
    adminDiscordId: session.user.id,
    targetType: "SITE_ALERT",
    targetId: alert.id,
  }).catch(() => null);

  return NextResponse.json({ success: true, alert });
}

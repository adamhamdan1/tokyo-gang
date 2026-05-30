import { createAdminLog } from "@/lib/admin-log";
import { getDatabaseAdminIds, getOwnerAdminIds, requireAdminCapability } from "@/lib/admin-permissions";
import { isDiscordSnowflake } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AdminBody = {
  action?: "ADD" | "REMOVE";
  discordId?: string;
};

export async function POST(req: Request) {
  const admin = await requireAdminCapability("ALL");

  if (!admin?.isOwner) {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const body = (await req.json()) as AdminBody;
  const discordId = body.discordId?.trim();

  if (!discordId || !isDiscordSnowflake(discordId)) {
    return NextResponse.json({ error: "Discord ID غير صحيح" }, { status: 400 });
  }

  if (getOwnerAdminIds().includes(discordId)) {
    return NextResponse.json({ error: "هذا الإداري أساسي من Vercel Env ولا ينحذف من الموقع" }, { status: 400 });
  }

  const currentAdmins = await getDatabaseAdminIds();
  const nextAdmins =
    body.action === "REMOVE"
      ? currentAdmins.filter((id) => id !== discordId)
      : [...new Set([...currentAdmins, discordId])];

  await prisma.siteSetting.upsert({
    where: { key: "extraAdminDiscordIds" },
    update: {
      value: nextAdmins.join(","),
      updatedBy: admin.id,
    },
    create: {
      key: "extraAdminDiscordIds",
      value: nextAdmins.join(","),
      updatedBy: admin.id,
    },
  });

  await createAdminLog({
    action: body.action === "REMOVE" ? "ADMIN_REMOVE" : "ADMIN_ADD",
    title: `${body.action === "REMOVE" ? "إزالة" : "إضافة"} إداري`,
    details: discordId,
    adminDiscordId: admin.id,
    targetType: "ADMIN",
    targetId: discordId,
  }).catch(() => null);

  return NextResponse.json({ success: true, admins: nextAdmins });
}

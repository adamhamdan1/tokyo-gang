import { createAdminLog } from "@/lib/admin-log";
import { getDatabaseAdminIds, getOwnerAdminIds, requireAdminCapability } from "@/lib/admin-permissions";
import { getTokyoGuildMember, isDiscordSnowflake, resolveTokyoGangRole } from "@/lib/discord";
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

  if (body.action !== "ADD" && body.action !== "REMOVE") {
    return NextResponse.json({ error: "الإجراء المطلوب غير صالح" }, { status: 400 });
  }

  if (!discordId || !isDiscordSnowflake(discordId)) {
    return NextResponse.json({ error: "الحساب المحدد غير صالح" }, { status: 400 });
  }

  if (getOwnerAdminIds().includes(discordId)) {
    return NextResponse.json({ error: "هذا إداري أساسي من إعدادات الاستضافة ولا يمكن حذفه من الموقع" }, { status: 400 });
  }

  if (body.action === "ADD") {
    const [member, tokyoRole] = await Promise.all([
      getTokyoGuildMember(discordId).catch(() => null),
      resolveTokyoGangRole().catch(() => null),
    ]);

    if (!member || !tokyoRole || !member.roles?.includes(tokyoRole.id)) {
      return NextResponse.json(
        { error: "يمكن إضافة عضو يحمل رتبة TOKYO GANG حالياً فقط. حدّث مزامنة الأعضاء وحاول مجدداً." },
        { status: 400 }
      );
    }
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

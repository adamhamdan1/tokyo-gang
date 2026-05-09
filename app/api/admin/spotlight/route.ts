import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type SpotlightBody = {
  memberId?: string;
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

  const body = (await req.json()) as SpotlightBody;

  if (!body.memberId) {
    return NextResponse.json({ error: "اختار عضو للـ spotlight" }, { status: 400 });
  }

  const member = await prisma.tokyoMember.findUnique({
    where: { id: body.memberId },
  });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  await prisma.siteSetting.upsert({
    where: { key: "spotlightMemberId" },
    update: {
      value: member.id,
      updatedBy: session.user.id,
    },
    create: {
      key: "spotlightMemberId",
      value: member.id,
      updatedBy: session.user.id,
    },
  });

  await createAdminLog({
    action: "SPOTLIGHT_SET",
    title: `تحديد Spotlight: ${member.displayName}`,
    adminDiscordId: session.user.id,
    targetType: "MEMBER",
    targetId: member.id,
    targetMemberId: member.id,
  }).catch(() => null);

  return NextResponse.json({ success: true, member });
}

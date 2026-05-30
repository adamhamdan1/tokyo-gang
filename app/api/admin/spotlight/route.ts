import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type SpotlightBody = {
  memberId?: string;
  slot?: string;
};

const allowedSlots = new Set([
  "spotlightMemberId",
  "honorEliteMemberId",
  "honorPlayerMemberId",
  "honorStreamerMemberId",
  "honorRecentMemberId",
]);

export async function POST(req: Request) {
  const admin = await requireAdminCapability("MEMBERS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const body = (await req.json()) as SpotlightBody;

  if (!body.memberId) {
    return NextResponse.json({ error: "اختار عضو للـ spotlight" }, { status: 400 });
  }

  const slot = allowedSlots.has(body.slot ?? "") ? body.slot! : "spotlightMemberId";

  const member = await prisma.tokyoMember.findUnique({
    where: { id: body.memberId },
  });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  await prisma.siteSetting.upsert({
    where: { key: slot },
    update: {
      value: member.id,
      updatedBy: admin.id,
    },
    create: {
      key: slot,
      value: member.id,
      updatedBy: admin.id,
    },
  });

  await createAdminLog({
    action: "SPOTLIGHT_SET",
    title: `تحديد ${slot}: ${member.displayName}`,
    adminDiscordId: admin.id,
    targetType: "MEMBER",
    targetId: member.id,
    targetMemberId: member.id,
  }).catch(() => null);

  return NextResponse.json({ success: true, member });
}

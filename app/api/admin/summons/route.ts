import { auth } from "@/auth";
import {
  giveSummonRole,
  removeTokyoRole,
  sendAdminLog,
  sendDiscordDm,
  sendSummonChannelMessage,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type SummonBody = {
  memberId?: string;
  reason?: string;
  details?: string;
};

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

async function requireAdmin() {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Access Denied" }, { status: 403 }),
    };
  }

  return { authorized: true as const, session };
}

export async function POST(req: Request) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const body = (await req.json()) as SummonBody;
  const reason = body.reason?.trim();
  const details = body.details?.trim();

  if (!body.memberId || !reason) {
    return NextResponse.json({ error: "اختار العضو واكتب سبب الاستدعاء" }, { status: 400 });
  }

  const member = await prisma.tokyoMember.findUnique({
    where: { id: body.memberId },
  });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود في قاعدة TOKYO" }, { status: 404 });
  }

  await removeTokyoRole(member.discordId);
  await giveSummonRole(member.discordId);

  const summon = await prisma.summon.create({
    data: {
      memberId: member.id,
      reason,
      details,
      summonedBy: admin.session.user.id,
    },
  });

  await prisma.tokyoMember.update({
    where: { id: member.id },
    data: {
      inTokyoRole: false,
    },
  });

  const message =
    `**استدعاء إداري - TOKYO GANG**\n` +
    `العضو: <@${member.discordId}>\n` +
    `السبب: ${reason}` +
    `${details ? `\nالتفاصيل: ${details}` : ""}\n` +
    `الأدمن: ${admin.session.user.name ?? admin.session.user.id}`;

  await sendSummonChannelMessage(message);
  await sendDiscordDm(
    member.discordId,
    `تم استدعاؤك من إدارة TOKYO GANG.\nالسبب: ${reason}${details ? `\nالتفاصيل: ${details}` : ""}\nراجع روم الاستدعاء في السيرفر.`
  ).catch((error) => console.error("Discord DM failed", error));

  await sendAdminLog(
    `استدعاء عضو TOKYO\nالعضو: ${member.displayName} (${member.discordId})\nالسبب: ${reason}${
      details ? `\nالتفاصيل: ${details}` : ""
    }\nالأدمن: ${admin.session.user.name ?? admin.session.user.id}`
  ).catch((error) => console.error("Admin log failed", error));

  return NextResponse.json({ success: true, summon });
}

import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import {
  giveSummonRole,
  removeTokyoRole,
  sendAdminEmbed,
  sendAdminLog,
  sendDiscordDm,
  sendSummonChannelMessage,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
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

  await syncTokyoMembersSafely();

  const member = await prisma.tokyoMember.findUnique({
    where: { id: body.memberId },
  });

  if (!member?.inTokyoRole) {
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
      status: "SUMMONED",
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

  await sendAdminEmbed({
    title: "استدعاء عضو TOKYO",
    color: 2_282_478,
    fields: [
      { name: "العضو", value: `${member.displayName} (<@${member.discordId}>)`, inline: true },
      { name: "الأدمن", value: admin.session.user.name ?? admin.session.user.id, inline: true },
      { name: "السبب", value: reason },
      ...(details ? [{ name: "التفاصيل", value: details }] : []),
    ],
  }).catch((error) => {
    console.error("Admin embed failed", error);
    return sendAdminLog(
      `استدعاء عضو TOKYO\nالعضو: ${member.displayName} (${member.discordId})\nالسبب: ${reason}${
        details ? `\nالتفاصيل: ${details}` : ""
      }\nالأدمن: ${admin.session.user.name ?? admin.session.user.id}`
    ).catch((logError) => console.error("Admin log failed", logError));
  });

  await createAdminLog({
    action: "MEMBER_SUMMON",
    title: "استدعاء عضو TOKYO",
    details: `العضو: ${member.displayName} (${member.discordId})\nالسبب: ${reason}${
      details ? `\nالتفاصيل: ${details}` : ""
    }`,
    adminDiscordId: admin.session.user.id,
    targetType: "SUMMON",
    targetId: summon.id,
    targetMemberId: member.id,
  }).catch((error) => console.error("Admin db log failed", error));

  return NextResponse.json({ success: true, summon });
}

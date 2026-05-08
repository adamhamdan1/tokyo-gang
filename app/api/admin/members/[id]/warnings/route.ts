import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { sendAdminEmbed, sendAdminLog, sendDiscordDm } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type WarningBody = {
  reason?: string;
  severity?: string;
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

export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const { id } = await context.params;
  const body = (await req.json()) as WarningBody;
  const reason = body.reason?.trim();
  const details = body.details?.trim();
  const severity = ["NORMAL", "HIGH", "FINAL"].includes(body.severity ?? "") ? body.severity! : "NORMAL";

  if (!reason) {
    return NextResponse.json({ error: "اكتب سبب التحذير" }, { status: 400 });
  }

  const member = await prisma.tokyoMember.findUnique({
    where: { id },
  });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  const warning = await prisma.memberWarning.create({
    data: {
      memberId: member.id,
      reason,
      severity,
      details,
      issuedBy: admin.session.user.id,
    },
  });

  await prisma.tokyoMember.update({
    where: { id: member.id },
    data: {
      status: severity === "FINAL" ? "FINAL_WARNING" : "WARNED",
    },
  });

  const message =
    `**تحذير إداري - TOKYO GANG**\n` +
    `العضو: <@${member.discordId}>\n` +
    `القوة: ${severity}\n` +
    `السبب: ${reason}` +
    `${details ? `\nالتفاصيل: ${details}` : ""}\n` +
    `الأدمن: ${admin.session.user.name ?? admin.session.user.id}`;

  await sendAdminEmbed({
    title: "تحذير إداري",
    color: severity === "FINAL" ? 15_116_280 : 16_776_960,
    fields: [
      { name: "العضو", value: `${member.displayName} (<@${member.discordId}>)`, inline: true },
      { name: "القوة", value: severity, inline: true },
      { name: "الأدمن", value: admin.session.user.name ?? admin.session.user.id, inline: true },
      { name: "السبب", value: reason },
      ...(details ? [{ name: "التفاصيل", value: details }] : []),
    ],
  }).catch((error) => {
    console.error("Warning admin embed failed", error);
    return sendAdminLog(message).catch((logError) => console.error("Warning admin log failed", logError));
  });
  await sendDiscordDm(
    member.discordId,
    `وصلك تحذير من إدارة TOKYO GANG.\nالقوة: ${severity}\nالسبب: ${reason}${details ? `\nالتفاصيل: ${details}` : ""}`
  ).catch((error) => console.error("Warning DM failed", error));
  await createAdminLog({
    action: "MEMBER_WARNING",
    title: `تحذير عضو: ${severity}`,
    details: `العضو: ${member.displayName} (${member.discordId})\nالسبب: ${reason}${details ? `\nالتفاصيل: ${details}` : ""}`,
    adminDiscordId: admin.session.user.id,
    targetType: "WARNING",
    targetId: warning.id,
    targetMemberId: member.id,
  }).catch((error) => console.error("Warning db log failed", error));

  return NextResponse.json({ success: true, warning });
}

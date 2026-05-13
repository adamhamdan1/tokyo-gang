import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import {
  applyWarningRole,
  removeAllWarningRoles,
  removeWarningRole,
  sendAdminEmbed,
  sendAdminLog,
  sendDiscordDm,
  sendWarningChannelEmbed,
} from "@/lib/discord";
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

type DeleteWarningBody = {
  warningId?: string;
  all?: boolean;
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

function normalizeWarningSeverity(value: string): "NORMAL" | "HIGH" | "DISMISSAL" {
  if (value === "HIGH" || value === "FINAL") {
    return "HIGH";
  }

  if (value === "DISMISSAL") {
    return "DISMISSAL";
  }

  return "NORMAL";
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
  const severity = ["NORMAL", "HIGH", "DISMISSAL"].includes(body.severity ?? "")
    ? (body.severity as "NORMAL" | "HIGH" | "DISMISSAL")
    : "NORMAL";

  if (!reason) {
    return NextResponse.json({ error: "اكتب سبب التحذير" }, { status: 400 });
  }

  const member = await prisma.tokyoMember.findUnique({
    where: { id },
  });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  try {
    await applyWarningRole(member.discordId, severity);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل إعطاء رتبة التحذير" },
      { status: 400 }
    );
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
  const recentStrongWarnings = await prisma.memberWarning.count({
    where: {
      memberId: member.id,
      severity: "HIGH",
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    },
  });
  const escalated = severity === "HIGH" && recentStrongWarnings >= 2;
  const totalWarningCount = await prisma.memberWarning.count({
    where: {
      memberId: member.id,
    },
  });

  await prisma.tokyoMember.update({
    where: { id: member.id },
    data: {
      status: severity === "DISMISSAL" ? "DISMISSED" : escalated ? "HIGH_RISK" : "WARNED",
      inTokyoRole: severity === "DISMISSAL" ? false : member.inTokyoRole,
      behaviorScore: {
        decrement: severity === "DISMISSAL" ? 100 : severity === "HIGH" ? 20 : 10,
      },
    },
  });

  const message =
    `**${severity === "DISMISSAL" ? "فصل إداري" : "تحذير إداري"} - TOKYO GANG**\n` +
    `العضو: <@${member.discordId}>\n` +
    `القوة: ${severity}\n` +
    `السبب: ${reason}` +
    `${details ? `\nالتفاصيل: ${details}` : ""}\n` +
    `الأدمن: ${admin.session.user.name ?? admin.session.user.id}`;

  await sendAdminEmbed({
    title: severity === "DISMISSAL" ? "فصل عضو TOKYO" : "تحذير إداري",
    color: severity === "DISMISSAL" ? 15_116_280 : 16_776_960,
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
  await sendWarningChannelEmbed({
    memberDiscordId: member.discordId,
    memberName: member.displayName,
    severity,
    reason,
    details,
    adminName: admin.session.user.name ?? admin.session.user.id,
    warningCount: totalWarningCount,
    avatarUrl: member.image,
  }).catch((error) => console.error("Warning public channel embed failed", error));
  await sendDiscordDm(
    member.discordId,
    severity === "DISMISSAL"
      ? `تم فصلك من TOKYO GANG.\nالسبب: ${reason}${details ? `\nالتفاصيل: ${details}` : ""}`
      : `وصلك تحذير من إدارة TOKYO GANG.\nالقوة: ${severity}\nالسبب: ${reason}${details ? `\nالتفاصيل: ${details}` : ""}`
  ).catch((error) => console.error("Warning DM failed", error));
  await createAdminLog({
    action: escalated ? "MEMBER_ESCALATION" : "MEMBER_WARNING",
    title: escalated ? `تصعيد تلقائي: ${member.displayName}` : `تحذير عضو: ${severity}`,
    details: `العضو: ${member.displayName} (${member.discordId})\nالسبب: ${reason}${details ? `\nالتفاصيل: ${details}` : ""}`,
    adminDiscordId: admin.session.user.id,
    targetType: "WARNING",
    targetId: warning.id,
    targetMemberId: member.id,
  }).catch((error) => console.error("Warning db log failed", error));

  return NextResponse.json({ success: true, warning });
}

export async function DELETE(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const { id } = await context.params;
  const body = (await req.json()) as DeleteWarningBody;
  const member = await prisma.tokyoMember.findUnique({
    where: { id },
  });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  if (body.all) {
    await removeAllWarningRoles(member.discordId).catch((error) => console.error("Remove all warning roles failed", error));
    const deleted = await prisma.memberWarning.deleteMany({
      where: { memberId: member.id },
    });

    await prisma.tokyoMember.update({
      where: { id: member.id },
      data: {
        status: member.inTokyoRole ? "ACTIVE" : member.status === "DISMISSED" ? "DISMISSED" : member.status,
      },
    });

    await createAdminLog({
      action: "MEMBER_WARNINGS_CLEAR",
      title: `حذف كل تحذيرات: ${member.displayName}`,
      details: `تم حذف ${deleted.count} تحذير`,
      adminDiscordId: admin.session.user.id,
      targetType: "WARNING",
      targetMemberId: member.id,
    }).catch((error) => console.error("Warning clear db log failed", error));

    return NextResponse.json({ success: true, deleted: deleted.count });
  }

  if (!body.warningId) {
    return NextResponse.json({ error: "حدد التحذير" }, { status: 400 });
  }

  const warning = await prisma.memberWarning.findFirst({
    where: {
      id: body.warningId,
      memberId: member.id,
    },
  });

  if (!warning) {
    return NextResponse.json({ error: "التحذير غير موجود" }, { status: 404 });
  }

  await removeWarningRole(member.discordId, normalizeWarningSeverity(warning.severity)).catch((error) =>
    console.error("Remove warning role failed", error)
  );
  await prisma.memberWarning.delete({
    where: { id: warning.id },
  });

  const remainingWarnings = await prisma.memberWarning.count({
    where: { memberId: member.id },
  });

  if (remainingWarnings === 0 && member.inTokyoRole) {
    await prisma.tokyoMember.update({
      where: { id: member.id },
      data: { status: "ACTIVE" },
    });
  }

  await createAdminLog({
    action: "MEMBER_WARNING_DELETE",
    title: `حذف تحذير: ${member.displayName}`,
    details: `النوع: ${warning.severity}\nالسبب: ${warning.reason}`,
    adminDiscordId: admin.session.user.id,
    targetType: "WARNING",
    targetId: warning.id,
    targetMemberId: member.id,
  }).catch((error) => console.error("Warning delete db log failed", error));

  return NextResponse.json({ success: true, remainingWarnings });
}

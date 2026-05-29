import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { giveLeaveRole, sendAdminEmbed, sendDiscordDm } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type LeaveDecisionBody = {
  status?: string;
  adminNote?: string;
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

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const { id } = await context.params;
  const body = (await req.json()) as LeaveDecisionBody;
  const status = body.status === "APPROVED" ? "APPROVED" : body.status === "REJECTED" ? "REJECTED" : null;

  if (!status) {
    return NextResponse.json({ error: "قرار الإجازة غير صحيح" }, { status: 400 });
  }

  const leave = await prisma.leaveRequest.findUnique({
    where: { id },
    include: { member: true },
  });

  if (!leave) {
    return NextResponse.json({ error: "طلب الإجازة غير موجود" }, { status: 404 });
  }

  if (leave.status !== "PENDING") {
    return NextResponse.json({ error: "تمت مراجعة هذا الطلب مسبقاً" }, { status: 400 });
  }

  if (status === "APPROVED") {
    try {
      await giveLeaveRole(leave.member.discordId);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "فشل إعطاء رتبة الإجازة" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status,
          reviewedBy: admin.session.user.id,
          adminNote: body.adminNote?.trim(),
        },
      }),
      prisma.tokyoMember.update({
        where: { id: leave.memberId },
        data: { status: "ON_LEAVE" },
      }),
    ]);
  } else {
    await prisma.leaveRequest.update({
      where: { id: leave.id },
      data: {
        status,
        reviewedBy: admin.session.user.id,
        adminNote: body.adminNote?.trim(),
      },
    });
  }

  await sendDiscordDm(
    leave.member.discordId,
    status === "APPROVED"
      ? `تم قبول إجازتك في TOKYO GANG وتم إعطاؤك رتبة الإجازة.\nالسبب: ${leave.reason}${leave.endsAt ? `\nتنتهي: ${leave.endsAt.toLocaleString("ar")}` : ""}`
      : `تم رفض طلب إجازتك في TOKYO GANG.${body.adminNote ? `\nالسبب: ${body.adminNote}` : ""}`
  ).catch(() => null);

  await createAdminLog({
    action: status === "APPROVED" ? "LEAVE_APPROVE" : "LEAVE_REJECT",
    title: `${status === "APPROVED" ? "قبول" : "رفض"} إجازة ${leave.member.displayName}`,
    details: body.adminNote?.trim() || leave.reason,
    adminDiscordId: admin.session.user.id,
    targetType: "LEAVE",
    targetId: leave.id,
    targetMemberId: leave.memberId,
  });

  await sendAdminEmbed({
    title: status === "APPROVED" ? "قبول إجازة" : "رفض إجازة",
    color: status === "APPROVED" ? 6_543_333 : 15_116_280,
    fields: [
      { name: "العضو", value: `${leave.member.displayName} (<@${leave.member.discordId}>)`, inline: true },
      { name: "المسؤول", value: admin.session.user.name ?? admin.session.user.id, inline: true },
      { name: "السبب", value: leave.reason },
    ],
  }).catch((error) => console.error("Leave decision embed failed", error));

  return NextResponse.json({ success: true });
}

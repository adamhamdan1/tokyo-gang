import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { applyInternalRankRole, giveLeaveRole, removeTokyoRole, sendAdminEmbed, sendDiscordDm } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ActionBody = {
  action?: string;
  rank?: string;
  reason?: string;
  note?: string;
  score?: number;
  startsAt?: string;
  endsAt?: string;
  durationDays?: number;
};

const allowedRanks = ["MEMBER", "SENIOR", "OFFICER", "DEPUTY", "LEADER"];

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
  const body = (await req.json()) as ActionBody;
  const member = await prisma.tokyoMember.findUnique({ where: { id } });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  if (body.action === "RANK") {
    const rank = body.rank?.toUpperCase() ?? "";

    if (!allowedRanks.includes(rank)) {
      return NextResponse.json({ error: "رتبة داخلية غير صحيحة" }, { status: 400 });
    }

    let discordRoleId: string;

    try {
      discordRoleId = await applyInternalRankRole(member.discordId, rank, member.internalRank);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "فشل تعديل رتبة الديسكورد" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.tokyoMember.update({ where: { id: member.id }, data: { internalRank: rank } }),
      prisma.roleAudit.create({
        data: {
          memberId: member.id,
          action: "RANK_CHANGE",
          rank,
          discordRoleId,
          reason: body.reason?.trim(),
          adminDiscordId: admin.session.user.id,
        },
      }),
    ]);

    await createAdminLog({
      action: "RANK_CHANGE",
      title: `تغيير رتبة ${member.displayName} إلى ${rank}`,
      details: body.reason?.trim(),
      adminDiscordId: admin.session.user.id,
      targetType: "MEMBER",
      targetId: member.id,
      targetMemberId: member.id,
    });

    await sendAdminEmbed({
      title: "تغيير رتبة داخلية",
      fields: [
        { name: "العضو", value: `${member.displayName} (<@${member.discordId}>)`, inline: true },
        { name: "الرتبة", value: rank, inline: true },
        { name: "الأدمن", value: admin.session.user.name ?? admin.session.user.id, inline: true },
        ...(body.reason ? [{ name: "السبب", value: body.reason }] : []),
      ],
    }).catch((error) => console.error("Rank embed failed", error));

    return NextResponse.json({ success: true });
  }

  if (body.action === "NOTE") {
    const note = body.note?.trim();

    if (!note) {
      return NextResponse.json({ error: "اكتب الملاحظة" }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.memberNote.create({
        data: {
          memberId: member.id,
          note,
          adminDiscordId: admin.session.user.id,
        },
      }),
      prisma.tokyoMember.update({ where: { id: member.id }, data: { adminNote: note } }),
    ]);

    await createAdminLog({
      action: "MEMBER_NOTE",
      title: `ملاحظة إدارية على ${member.displayName}`,
      details: note,
      adminDiscordId: admin.session.user.id,
      targetType: "MEMBER",
      targetId: member.id,
      targetMemberId: member.id,
    });

    return NextResponse.json({ success: true });
  }

  if (body.action === "SCORE") {
    const score = Number(body.score);

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: "التقييم لازم يكون بين 0 و 100" }, { status: 400 });
    }

    await prisma.tokyoMember.update({ where: { id: member.id }, data: { behaviorScore: Math.round(score) } });
    await createAdminLog({
      action: "MEMBER_SCORE",
      title: `تعديل تقييم ${member.displayName} إلى ${Math.round(score)}`,
      details: body.reason?.trim(),
      adminDiscordId: admin.session.user.id,
      targetType: "MEMBER",
      targetId: member.id,
      targetMemberId: member.id,
    });

    return NextResponse.json({ success: true });
  }

  if (body.action === "LEAVE") {
    const reason = body.reason?.trim();

    if (!reason) {
      return NextResponse.json({ error: "اكتب سبب الإجازة" }, { status: 400 });
    }

    const durationDays = Number(body.durationDays);
    const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();
    const endsAt = body.endsAt
      ? new Date(body.endsAt)
      : Number.isFinite(durationDays) && durationDays > 0
        ? new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000)
        : null;

    try {
      await giveLeaveRole(member.discordId);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "فشل إعطاء رتبة الإجازة" },
        { status: 400 }
      );
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        memberId: member.id,
        reason,
        startsAt,
        endsAt,
        status: "APPROVED",
        reviewedBy: admin.session.user.id,
      },
    });

    await prisma.tokyoMember.update({ where: { id: member.id }, data: { status: "ON_LEAVE" } });
    await sendDiscordDm(
      member.discordId,
      `تم تسجيل إجازتك في TOKYO GANG وتم إعطاؤك رتبة الإجازة.\nالسبب: ${reason}${
        endsAt ? `\nتنتهي: ${endsAt.toLocaleString("ar")}` : ""
      }`
    ).catch(() => null);
    await createAdminLog({
      action: "LEAVE_APPROVE",
      title: `تسجيل إجازة ${member.displayName}`,
      details: reason,
      adminDiscordId: admin.session.user.id,
      targetType: "LEAVE",
      targetId: leave.id,
      targetMemberId: member.id,
    });

    return NextResponse.json({ success: true });
  }

  if (body.action === "BLACKLIST") {
    const reason = body.reason?.trim();

    if (!reason) {
      return NextResponse.json({ error: "اكتب سبب البلاك ليست" }, { status: 400 });
    }

    await removeTokyoRole(member.discordId).catch((error) => console.error("Blacklist remove role failed", error));
    const entry = await prisma.blacklistEntry.create({
      data: {
        discordId: member.discordId,
        username: member.username,
        reason,
        adminDiscordId: admin.session.user.id,
        memberId: member.id,
      },
    });

    await prisma.tokyoMember.update({ where: { id: member.id }, data: { status: "BLACKLISTED", inTokyoRole: false } });
    await createAdminLog({
      action: "BLACKLIST_ADD",
      title: `إضافة ${member.displayName} للبلاك ليست`,
      details: reason,
      adminDiscordId: admin.session.user.id,
      targetType: "BLACKLIST",
      targetId: entry.id,
      targetMemberId: member.id,
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}

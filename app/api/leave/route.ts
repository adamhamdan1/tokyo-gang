import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { sendAdminEmbed } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
import { NextResponse } from "next/server";

type LeaveBody = {
  reason?: string;
  durationDays?: number;
  startsAt?: string;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "سجل دخول بالديسكورد أولاً" }, { status: 401 });
  }

  await syncTokyoMembersSafely();

  const member = await prisma.tokyoMember.findUnique({
    where: { discordId: session.user.id },
  });

  if (!member?.inTokyoRole) {
    return NextResponse.json({ error: "طلبات الإجازة لأعضاء TOKYO فقط" }, { status: 403 });
  }

  const body = (await req.json()) as LeaveBody;
  const reason = body.reason?.trim();
  const durationDays = Number(body.durationDays);

  if (!reason) {
    return NextResponse.json({ error: "اكتب سبب الإجازة" }, { status: 400 });
  }

  if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 60) {
    return NextResponse.json({ error: "مدة الإجازة لازم تكون بين 1 و 60 يوم" }, { status: 400 });
  }

  const startsAt = body.startsAt ? new Date(body.startsAt) : new Date();

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "وقت بداية الإجازة غير صحيح" }, { status: 400 });
  }

  const leave = await prisma.leaveRequest.create({
    data: {
      memberId: member.id,
      reason,
      startsAt,
      endsAt: new Date(startsAt.getTime() + durationDays * 24 * 60 * 60 * 1000),
      status: "PENDING",
    },
  });

  await createAdminLog({
    action: "LEAVE_REQUEST",
    title: `طلب إجازة جديد من ${member.displayName}`,
    details: reason,
    targetType: "LEAVE",
    targetId: leave.id,
    targetMemberId: member.id,
  });

  await sendAdminEmbed({
    title: "طلب إجازة جديد",
    color: 6_543_333,
    fields: [
      { name: "العضو", value: `${member.displayName} (<@${member.discordId}>)`, inline: true },
      { name: "المدة", value: `${durationDays} يوم`, inline: true },
      { name: "السبب", value: reason },
    ],
  }).catch((error) => console.error("Leave request embed failed", error));

  return NextResponse.json({ success: true });
}

import { requireAdminCapability } from "@/lib/admin-permissions";
import { sendAdminEmbed } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const admin = await requireAdminCapability("LOGS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [applications, accepted, rejected, warnings, summons, complaints, leaves] = await Promise.all([
    prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { status: "ACCEPTED", decidedAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { status: "REJECTED", decidedAt: { gte: weekAgo } } }),
    prisma.memberWarning.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.summon.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.complaint.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.leaveRequest.count({ where: { createdAt: { gte: weekAgo } } }),
  ]);

  await sendAdminEmbed({
    title: "TOKYO Weekly Command Report",
    color: 16_711_680,
    fields: [
      { name: "التقديمات", value: String(applications), inline: true },
      { name: "المقبولين", value: String(accepted), inline: true },
      { name: "المرفوضين", value: String(rejected), inline: true },
      { name: "التحذيرات", value: String(warnings), inline: true },
      { name: "الاستدعاءات", value: String(summons), inline: true },
      { name: "الشكاوي", value: String(complaints), inline: true },
      { name: "الإجازات", value: String(leaves), inline: true },
      { name: "أرسل بواسطة", value: admin.name, inline: true },
    ],
  });

  return NextResponse.json({ success: true });
}

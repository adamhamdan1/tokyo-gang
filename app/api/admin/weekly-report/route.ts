import { requireAdminCapability } from "@/lib/admin-permissions";
import { sendAdminEmbed } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const admin = await requireAdminCapability("LOGS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const configuredDays = Number(process.env.TOKYO_REPORT_DAYS ?? 7);
  const activityWindowDays = Number.isInteger(configuredDays) ? Math.min(30, Math.max(1, configuredDays)) : 7;
  const activitySince = new Date(Date.now() - activityWindowDays * 24 * 60 * 60 * 1000);
  const [applications, accepted, rejected, warnings, summons, complaints, leaves] = await Promise.all([
    prisma.application.count({ where: { createdAt: { gte: activitySince } } }),
    prisma.application.count({ where: { status: "ACCEPTED", decidedAt: { gte: activitySince } } }),
    prisma.application.count({ where: { status: "REJECTED", decidedAt: { gte: activitySince } } }),
    prisma.memberWarning.count({ where: { createdAt: { gte: activitySince } } }),
    prisma.summon.count({ where: { createdAt: { gte: activitySince } } }),
    prisma.complaint.count({ where: { createdAt: { gte: activitySince } } }),
    prisma.leaveRequest.count({ where: { createdAt: { gte: activitySince } } }),
  ]);

  await sendAdminEmbed({
    title: `TOKYO Command Report — ${activityWindowDays} Days`,
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

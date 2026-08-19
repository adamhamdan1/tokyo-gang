import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { sendAdminEmbed, sendAdminLog, sendComplaintLogMessage } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
import { NextResponse } from "next/server";
import { cleanBoundedText, cleanOptionalText, isSafeHttpUrl, validateJsonWriteRequest } from "@/lib/request-security";

type ComplaintBody = {
  accusedId?: string;
  category?: string;
  reason?: string;
  evidenceUrl?: string;
  details?: string;
};

export async function POST(req: Request) {
  const requestError = validateJsonWriteRequest(req, 20_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "لازم تسجل دخول بالديسكورد" }, { status: 401 });
  }

  await syncTokyoMembersSafely();

  const reporter = await prisma.tokyoMember.findUnique({
    where: { discordId: session.user.id },
  });

  if (!reporter?.inTokyoRole) {
    return NextResponse.json({ error: "نظام الشكاوي متاح فقط لأعضاء TOKYO" }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as ComplaintBody | null;
  const category = cleanBoundedText(body?.category, 80);
  const reason = cleanBoundedText(body?.reason, 1_000);
  const evidenceUrl = cleanOptionalText(body?.evidenceUrl, 700);
  const details = cleanOptionalText(body?.details, 2_000);

  if (!body?.accusedId || !category || !reason || evidenceUrl === null || details === null) {
    return NextResponse.json({ error: "اختار العضو ونوع الشكوى واكتب السبب" }, { status: 400 });
  }

  if (evidenceUrl && !isSafeHttpUrl(evidenceUrl)) {
    return NextResponse.json({ error: "رابط الدليل لازم يكون رابط HTTP أو HTTPS صحيح" }, { status: 400 });
  }

  const accused = await prisma.tokyoMember.findUnique({
    where: { id: body.accusedId },
  });

  if (!accused?.inTokyoRole) {
    return NextResponse.json({ error: "العضو المشكو عليه غير موجود ضمن أعضاء TOKYO" }, { status: 404 });
  }

  if (accused.id === reporter.id) {
    return NextResponse.json({ error: "ما بتقدر ترفع شكوى على نفسك" }, { status: 400 });
  }

  const duplicateComplaint = await prisma.complaint.findFirst({
    where: {
      reporterId: reporter.id,
      accusedId: accused.id,
      status: {
        in: ["OPEN", "REVIEWING"],
      },
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    },
  });

  if (duplicateComplaint) {
    return NextResponse.json(
      { error: "عندك شكوى مفتوحة على نفس العضو. انتظر مراجعة الإدارة بدل تكرارها" },
      { status: 409 }
    );
  }

  const recentComplaintCount = await prisma.complaint.count({
    where: {
      reporterId: reporter.id,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  if (recentComplaintCount >= 3) {
    return NextResponse.json({ error: "وصلت للحد اليومي للشكاوى. راجع الإدارة إذا كانت الحالة طارئة" }, { status: 429 });
  }

  const complaint = await prisma.complaint.create({
    data: {
      reporterId: reporter.id,
      accusedId: accused.id,
      category,
      reason,
      evidenceUrl: evidenceUrl || null,
      details: details || null,
    },
  });

  const logMessage =
    `**شكوى أعضاء - TOKYO GANG**\n` +
    `المشتكي: <@${reporter.discordId}> (${reporter.displayName})\n` +
    `المشكو عليه: <@${accused.discordId}> (${accused.displayName})\n` +
    `النوع: ${category}\n` +
    `السبب: ${reason}` +
    `${details ? `\nالتفاصيل: ${details}` : ""}` +
    `${evidenceUrl ? `\nالدليل: ${evidenceUrl}` : ""}\n` +
    `رقم الشكوى: ${complaint.id}`;

  await sendComplaintLogMessage(logMessage).catch((error) => console.error("Complaint Discord log failed", error));
  await sendAdminEmbed({
    title: "شكوى أعضاء جديدة",
    color: 15_116_280,
    fields: [
      { name: "المشتكي", value: `${reporter.displayName} (<@${reporter.discordId}>)`, inline: true },
      { name: "المشكو عليه", value: `${accused.displayName} (<@${accused.discordId}>)`, inline: true },
      { name: "النوع", value: category, inline: true },
      { name: "السبب", value: reason },
      ...(details ? [{ name: "التفاصيل", value: details }] : []),
      ...(evidenceUrl ? [{ name: "الدليل", value: evidenceUrl }] : []),
    ],
  }).catch((error) => {
    console.error("Complaint admin embed failed", error);
    return sendAdminLog(logMessage).catch((logError) => console.error("Complaint admin log failed", logError));
  });
  await createAdminLog({
    action: "COMPLAINT_CREATE",
    title: "شكوى عضو جديدة",
    details: logMessage,
    adminDiscordId: reporter.discordId,
    targetType: "COMPLAINT",
    targetId: complaint.id,
    targetMemberId: accused.id,
  }).catch((error) => console.error("Complaint db log failed", error));

  return NextResponse.json({ success: true, complaint });
}

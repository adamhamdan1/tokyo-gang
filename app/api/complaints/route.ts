import { auth } from "@/auth";
import { sendAdminLog, sendComplaintLogMessage } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type ComplaintBody = {
  accusedId?: string;
  category?: string;
  reason?: string;
  evidenceUrl?: string;
  details?: string;
};

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "لازم تسجل دخول بالديسكورد" }, { status: 401 });
  }

  const reporter = await prisma.tokyoMember.findUnique({
    where: { discordId: session.user.id },
  });

  if (!reporter?.inTokyoRole) {
    return NextResponse.json({ error: "نظام الشكاوي متاح فقط لأعضاء TOKYO" }, { status: 403 });
  }

  const body = (await req.json()) as ComplaintBody;
  const category = body.category?.trim();
  const reason = body.reason?.trim();
  const evidenceUrl = body.evidenceUrl?.trim();
  const details = body.details?.trim();

  if (!body.accusedId || !category || !reason) {
    return NextResponse.json({ error: "اختار العضو ونوع الشكوى واكتب السبب" }, { status: 400 });
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

  const complaint = await prisma.complaint.create({
    data: {
      reporterId: reporter.id,
      accusedId: accused.id,
      category,
      reason,
      evidenceUrl,
      details,
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
  await sendAdminLog(logMessage).catch((error) => console.error("Complaint admin log failed", error));

  return NextResponse.json({ success: true, complaint });
}

import { giveAcceptedRole, giveCatalogRole, giveTrialRole, sendAdminLog, sendDiscordDm } from "@/lib/discord";
import { createAdminLog } from "@/lib/admin-log";
import { getAdminContext } from "@/lib/admin-permissions";
import { isStreamerApplication } from "@/lib/application-types";
import { prisma } from "@/lib/prisma";
import { validateJsonWriteRequest } from "@/lib/request-security";
import { getTokyoRoleOption } from "@/lib/tokyo-content";
import { NextResponse } from "next/server";
import { ensureCommandSchema } from "@/lib/command-schema";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateBody = {
  action?: string;
  status?: string;
  decisionReason?: string;
  internalNote?: string;
  interviewAt?: string;
  interviewNote?: string;
  interviewAssignedTo?: string;
  interviewAttendance?: string;
  interviewScore?: number;
  interviewEvaluation?: string;
};

export async function PATCH(req: Request, context: RouteContext) {
  const requestError = validateJsonWriteRequest(req, 12_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });

  const admin = await getAdminContext();

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await req.json().catch(() => null)) as UpdateBody | null;

  const currentApplication = await prisma.application.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!currentApplication) {
    return NextResponse.json({ error: "التقديم غير موجود" }, { status: 404 });
  }
  await ensureCommandSchema();

  const streamerApplication = isStreamerApplication(currentApplication.reviewFlag);
  const canReview = admin.capabilities.ALL || (streamerApplication ? admin.capabilities.STREAMERS : admin.capabilities.APPLICATIONS);
  if (!canReview) return NextResponse.json({ error: "لا تملك صلاحية إدارة هذا النوع من التقديمات" }, { status: 403 });

  if (body?.action === "INTERVIEW_RESULT") {
    const score = Number(body.interviewScore);
    const attendance = body.interviewAttendance;
    const evaluation = body.interviewEvaluation?.trim();
    if (!attendance || !["PRESENT", "ABSENT", "RESCHEDULED"].includes(attendance)) {
      return NextResponse.json({ error: "حدد حالة حضور المقابلة" }, { status: 400 });
    }
    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return NextResponse.json({ error: "تقييم المقابلة لازم يكون بين 0 و100" }, { status: 400 });
    }
    if (!evaluation || evaluation.length > 1_000) {
      return NextResponse.json({ error: "اكتب خلاصة المقابلة بحد أقصى 1000 حرف" }, { status: 400 });
    }
    const application = await prisma.application.update({
      where: { id },
      data: {
        interviewAttendance: attendance,
        interviewScore: Math.round(score),
        interviewEvaluation: evaluation,
        interviewCompletedAt: new Date(),
        internalNote: [currentApplication.internalNote, `تقييم المقابلة ${Math.round(score)}/100: ${evaluation}`].filter(Boolean).join("\n\n"),
      },
    });
    await createAdminLog({
      action: "INTERVIEW_EVALUATION",
      title: `تقييم مقابلة ${currentApplication.user.username}: ${Math.round(score)}/100`,
      details: `${attendance}\n${evaluation}`,
      adminDiscordId: admin.id,
      targetType: "APPLICATION",
      targetId: id,
    });
    return NextResponse.json({ success: true, application });
  }

  if (!body?.status || !["ACCEPTED", "REJECTED", "PENDING", "INTERVIEW", "TRIAL"].includes(body.status)) {
    return NextResponse.json({ error: "حالة غير صحيحة" }, { status: 400 });
  }

  if (streamerApplication && body.status === "TRIAL") {
    return NextResponse.json({ error: "فترة التجربة متاحة لتقديمات العصابة فقط" }, { status: 400 });
  }

  if (currentApplication.status === "ACCEPTED" && body.status === "ACCEPTED") {
    return NextResponse.json({ error: "هذا الطلب مقبول بالفعل" }, { status: 409 });
  }

  if (body.status === "ACCEPTED") {
    try {
      if (streamerApplication) {
        const streamerRole = getTokyoRoleOption("STREAMER");
        if (!streamerRole) throw new Error("إعداد رتبة Streamer غير موجود");
        await giveCatalogRole(currentApplication.user.discordId, streamerRole.key, streamerRole.discordName);
      } else {
        await giveAcceptedRole(currentApplication.user.discordId);
      }
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "فشل إعطاء الرتبة" },
        { status: 400 }
      );
    }
  }

  if (body.status === "TRIAL") {
    try {
      await giveTrialRole(currentApplication.user.discordId);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "فشل إعطاء رتبة فترة التجربة" },
        { status: 400 }
      );
    }
  }

  const decisionReason =
    body.status === "REJECTED"
      ? body.decisionReason?.trim() || "لم يتم ذكر سبب"
      : null;
  let interviewAt: Date | null = null;
  if (body.status === "INTERVIEW") {
    if (!body.interviewAt) return NextResponse.json({ error: "حدد تاريخ ووقت المقابلة" }, { status: 400 });
    const parsedInterviewAt = new Date(body.interviewAt);
    if (Number.isNaN(parsedInterviewAt.getTime())) return NextResponse.json({ error: "صيغة موعد المقابلة غير صحيحة" }, { status: 400 });
    interviewAt = parsedInterviewAt;
  }
  const interviewNote =
    body.status === "INTERVIEW" ? body.interviewNote?.trim() || "تم تحديد مقابلة" : null;
  const interviewAssignedTo = body.status === "INTERVIEW" ? body.interviewAssignedTo?.trim().slice(0, 120) || admin.name : currentApplication.interviewAssignedTo;

  const application = await prisma.application.update({
    where: { id },
    data: {
      status: body.status,
      decisionReason,
      internalNote: body.internalNote?.trim() || currentApplication.internalNote,
      interviewAt,
      interviewNote,
      interviewAssignedTo,
      decidedBy: admin.id,
      decidedAt: new Date(),
    },
  });

  if (body.status === "ACCEPTED") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      streamerApplication
        ? `TOKYO MEDIA\n\nتم قبول تقديمك كـ Streamer رسمياً.\nتم إعطاؤك رتبة Streamer تلقائياً.\n\nمثّل TOKYO بأفضل صورة وخليك قد الثقة.`
        : `TOKYO GANG\n\nتم قبول طلبك رسمياً.\nتم إعطاؤك الرتبة تلقائياً، أهلاً في العصابة.\n\nالتزم بالقوانين وخليك قد الثقة.`
    ).catch((error) => console.error("Discord DM failed", error));
  }

  if (body.status === "TRIAL") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      `TOKYO GANG\n\nتم وضع طلبك على فترة تجربة.\nتم إعطاؤك رتبة التجربة تلقائياً.\n\nأثبت نشاطك والتزامك خلال الفترة الجاية.`
    ).catch((error) => console.error("Discord DM failed", error));
  }

  if (body.status === "REJECTED") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      `TOKYO GANG\n\nتم رفض طلبك حالياً.\nالسبب: ${decisionReason}\n\nيمكنك تحسين النقاط المطلوبة والمحاولة لاحقاً.`
    ).catch((error) => console.error("Discord DM failed", error));
  }

  if (body.status === "INTERVIEW") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      `TOKYO GANG\n\nطلبك انتقل لمرحلة المقابلة.\nالموعد: ${
        interviewAt ? interviewAt.toLocaleString("ar", { timeZone: "Europe/Stockholm" }) : "سيتم تحديده قريباً"
      }\nمسؤول المقابلة: ${interviewAssignedTo}\nملاحظة: ${interviewNote}\n\nراجع القوانين قبل المقابلة.`
    ).catch((error) => console.error("Discord DM failed", error));
  }

  await sendAdminLog(
    `قرار إدارة TOKYO: ${body.status}\nالعضو: ${currentApplication.user.username} (${currentApplication.user.discordId})\nالأدمن: ${admin.name}${
      decisionReason ? `\nسبب الرفض: ${decisionReason}` : ""
    }${interviewNote ? `\nملاحظة المقابلة: ${interviewNote}` : ""}${
      body.internalNote ? `\nملاحظة داخلية: ${body.internalNote}` : ""
    }`
  ).catch((error) => console.error("Admin log failed", error));

  await createAdminLog({
    action: "APPLICATION_DECISION",
    title: `قرار تقديم: ${body.status}`,
    details: `العضو: ${currentApplication.user.username} (${currentApplication.user.discordId})${
      decisionReason ? `\nسبب الرفض: ${decisionReason}` : ""
    }${interviewNote ? `\nملاحظة المقابلة: ${interviewNote}` : ""}${
      body.internalNote ? `\nملاحظة داخلية: ${body.internalNote}` : ""
    }`,
    adminDiscordId: admin.id,
    targetType: "APPLICATION",
    targetId: application.id,
  }).catch((error) => console.error("Admin db log failed", error));

  return NextResponse.json({ success: true, application });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const admin = await getAdminContext();

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }
  await ensureCommandSchema();

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!application) return NextResponse.json({ error: "التقديم غير موجود" }, { status: 404 });
  const streamerApplication = isStreamerApplication(application.reviewFlag);
  const canDelete = admin.capabilities.ALL || (streamerApplication ? admin.capabilities.STREAMERS : admin.capabilities.APPLICATIONS);
  if (!canDelete) return NextResponse.json({ error: "لا تملك صلاحية حذف هذا التقديم" }, { status: 403 });

  await prisma.application.delete({
    where: { id },
  });

  if (application) {
    await sendAdminLog(
      `حذف تقديم TOKYO\nالعضو: ${application.user.username} (${application.user.discordId})\nالأدمن: ${admin.name}`
    ).catch((error) => console.error("Admin log failed", error));
    await createAdminLog({
      action: "APPLICATION_DELETE",
      title: "حذف تقديم",
      details: `العضو: ${application.user.username} (${application.user.discordId})`,
      adminDiscordId: admin.id,
      targetType: "APPLICATION",
      targetId: application.id,
    }).catch((error) => console.error("Admin db log failed", error));
  }

  return NextResponse.json({ success: true });
}

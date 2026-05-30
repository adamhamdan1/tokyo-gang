import { giveAcceptedRole, giveTrialRole, sendAdminLog, sendDiscordDm } from "@/lib/discord";
import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateBody = {
  status?: string;
  decisionReason?: string;
  internalNote?: string;
  interviewAt?: string;
  interviewNote?: string;
};

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdminCapability("APPLICATIONS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await req.json()) as UpdateBody;

  if (!body.status || !["ACCEPTED", "REJECTED", "PENDING", "INTERVIEW", "TRIAL"].includes(body.status)) {
    return NextResponse.json({ error: "حالة غير صحيحة" }, { status: 400 });
  }

  const currentApplication = await prisma.application.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!currentApplication) {
    return NextResponse.json({ error: "التقديم غير موجود" }, { status: 404 });
  }

  if (currentApplication.status === "ACCEPTED" && body.status === "ACCEPTED") {
    return NextResponse.json({ error: "هذا الطلب مقبول بالفعل" }, { status: 409 });
  }

  if (body.status === "ACCEPTED") {
    try {
      await giveAcceptedRole(currentApplication.user.discordId);
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
  const interviewAt =
    body.status === "INTERVIEW" && body.interviewAt ? new Date(body.interviewAt) : null;
  const interviewNote =
    body.status === "INTERVIEW" ? body.interviewNote?.trim() || "تم تحديد مقابلة" : null;

  const application = await prisma.application.update({
    where: { id },
    data: {
      status: body.status,
      decisionReason,
      internalNote: body.internalNote?.trim() || currentApplication.internalNote,
      interviewAt,
      interviewNote,
      decidedBy: admin.id,
      decidedAt: new Date(),
    },
  });

  if (body.status === "ACCEPTED") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      `TOKYO GANG\n\nتم قبول طلبك رسمياً.\nتم إعطاؤك الرتبة تلقائياً، أهلاً في العصابة.\n\nالتزم بالقوانين وخليك قد الثقة.`
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
        interviewAt ? interviewAt.toLocaleString("ar") : "سيتم تحديده قريباً"
      }\nملاحظة: ${interviewNote}\n\nراجع القوانين قبل المقابلة.`
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
  const admin = await requireAdminCapability("APPLICATIONS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const application = await prisma.application.findUnique({
    where: { id },
    include: { user: true },
  });

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

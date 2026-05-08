import { auth } from "@/auth";
import { giveAcceptedRole, giveTrialRole, sendAdminLog, sendDiscordDm } from "@/lib/discord";
import { createAdminLog } from "@/lib/admin-log";
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

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

async function requireAdmin() {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return {
      authorized: false as const,
      response: NextResponse.json(
      {
        error: "Access Denied",
        currentDiscordId: session?.user?.id ?? null,
      },
      { status: 403 }
      ),
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
      decidedBy: admin.session.user.id,
      decidedAt: new Date(),
    },
  });

  if (body.status === "ACCEPTED") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      `تم قبول طلبك في TOKYO GANG. مبروك، تم إعطاؤك الرتبة تلقائياً.`
    ).catch((error) => console.error("Discord DM failed", error));
  }

  if (body.status === "TRIAL") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      `تم وضع طلبك في TOKYO GANG على فترة تجربة. تم إعطاؤك رتبة التجربة تلقائياً، أثبت نفسك.`
    ).catch((error) => console.error("Discord DM failed", error));
  }

  if (body.status === "REJECTED") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      `تم رفض طلبك في TOKYO GANG.\nالسبب: ${decisionReason}`
    ).catch((error) => console.error("Discord DM failed", error));
  }

  if (body.status === "INTERVIEW") {
    await sendDiscordDm(
      currentApplication.user.discordId,
      `طلبك في TOKYO GANG انتقل لمرحلة المقابلة.\nالموعد: ${
        interviewAt ? interviewAt.toLocaleString("ar") : "سيتم تحديده قريباً"
      }\nملاحظة: ${interviewNote}`
    ).catch((error) => console.error("Discord DM failed", error));
  }

  await sendAdminLog(
    `قرار إدارة TOKYO: ${body.status}\nالعضو: ${currentApplication.user.username} (${currentApplication.user.discordId})\nالأدمن: ${admin.session.user.name ?? admin.session.user.id}${
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
    adminDiscordId: admin.session.user.id,
    targetType: "APPLICATION",
    targetId: application.id,
  }).catch((error) => console.error("Admin db log failed", error));

  return NextResponse.json({ success: true, application });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
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
      `حذف تقديم TOKYO\nالعضو: ${application.user.username} (${application.user.discordId})\nالأدمن: ${admin.session.user.name ?? admin.session.user.id}`
    ).catch((error) => console.error("Admin log failed", error));
    await createAdminLog({
      action: "APPLICATION_DELETE",
      title: "حذف تقديم",
      details: `العضو: ${application.user.username} (${application.user.discordId})`,
      adminDiscordId: admin.session.user.id,
      targetType: "APPLICATION",
      targetId: application.id,
    }).catch((error) => console.error("Admin db log failed", error));
  }

  return NextResponse.json({ success: true });
}

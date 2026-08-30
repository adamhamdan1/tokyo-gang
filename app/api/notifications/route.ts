import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ensureCommandSchema } from "@/lib/command-schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type NotificationLevel = "INFO" | "SUCCESS" | "WARNING" | "DANGER";

type TokyoNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  level: NotificationLevel;
};

const applicationCopy: Record<string, { title: string; message: string; level: NotificationLevel }> = {
  PENDING: { title: "طلبك قيد المراجعة", message: "وصل تقديمك لفريق الإدارة وسيتم مراجعته.", level: "INFO" },
  ACCEPTED: { title: "تم قبول تقديمك", message: "مبروك، تم قبول طلب الانضمام الخاص بك.", level: "SUCCESS" },
  REJECTED: { title: "تم تحديث حالة تقديمك", message: "لم يتم قبول الطلب الحالي. راجع صفحة التقديم للتفاصيل.", level: "DANGER" },
  INTERVIEW: { title: "تم تحديد مرحلة المقابلة", message: "تقديمك انتقل لمرحلة المقابلة. راجع التفاصيل الآن.", level: "WARNING" },
  TRIAL: { title: "بدأت فترة التجربة", message: "تم نقلك إلى فترة التجربة داخل TOKYO.", level: "SUCCESS" },
};

export async function GET() {
  await ensureCommandSchema();
  const session = await auth();
  const now = new Date();
  const notifications: TokyoNotification[] = [];

  const [alert, announcements] = await Promise.all([
    prisma.siteAlert.findFirst({
      where: { active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      orderBy: { createdAt: "desc" },
    }),
    prisma.announcement.findMany({ where: { active: true }, orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  if (alert) {
    notifications.push({
      id: `alert:${alert.id}`,
      type: "SITE_ALERT",
      title: alert.title,
      message: alert.message,
      href: "/",
      createdAt: alert.createdAt.toISOString(),
      level: "DANGER",
    });
  }

  notifications.push(...announcements.map((announcement) => ({
    id: `announcement:${announcement.id}`,
    type: "ANNOUNCEMENT",
    title: announcement.title,
    message: announcement.message,
    href: "/#announcements",
    createdAt: announcement.createdAt.toISOString(),
    level: "INFO" as const,
  })));

  if (session?.user?.id) {
    const [user, member] = await Promise.all([
      prisma.user.findUnique({
        where: { discordId: session.user.id },
        include: { applications: { orderBy: { createdAt: "desc" }, take: 2 } },
      }),
      prisma.tokyoMember.findUnique({
        where: { discordId: session.user.id },
        include: {
          summons: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 3 },
          warnings: { orderBy: { createdAt: "desc" }, take: 3 },
          leaveRequests: { orderBy: { updatedAt: "desc" }, take: 3 },
        },
      }),
    ]);

    for (const application of user?.applications ?? []) {
      const copy = applicationCopy[application.status] ?? applicationCopy.PENDING;
      notifications.push({
        id: `application:${application.id}:${application.status}`,
        type: "APPLICATION",
        title: copy.title,
        message: application.decisionReason || copy.message,
        href: "/apply/status",
        createdAt: (application.decidedAt ?? application.createdAt).toISOString(),
        level: copy.level,
      });
    }

    for (const summon of member?.summons ?? []) {
      notifications.push({
        id: `summon:${summon.id}:${summon.status}`,
        type: "SUMMON",
        title: "لديك استدعاء إداري فعّال",
        message: summon.reason,
        href: "/summons",
        createdAt: summon.createdAt.toISOString(),
        level: "WARNING",
      });
    }

    for (const warning of member?.warnings ?? []) {
      notifications.push({
        id: `warning:${warning.id}`,
        type: "WARNING",
        title: warning.severity === "STRONG" ? "تحذير إداري قوي" : "تحذير إداري جديد",
        message: warning.reason,
        href: "/warnings",
        createdAt: warning.createdAt.toISOString(),
        level: warning.severity === "STRONG" ? "DANGER" : "WARNING",
      });
    }

    for (const leave of member?.leaveRequests ?? []) {
      notifications.push({
        id: `leave:${leave.id}:${leave.status}`,
        type: "LEAVE",
        title: leave.status === "ACCEPTED" ? "تم قبول إجازتك" : leave.status === "REJECTED" ? "تم تحديث طلب إجازتك" : "طلب الإجازة قيد المراجعة",
        message: leave.adminNote || leave.reason,
        href: "/leave",
        createdAt: leave.updatedAt.toISOString(),
        level: leave.status === "ACCEPTED" ? "SUCCESS" : leave.status === "REJECTED" ? "DANGER" : "INFO",
      });
    }
  }

  notifications.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

  return NextResponse.json(
    { notifications: notifications.slice(0, 20) },
    { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
  );
}

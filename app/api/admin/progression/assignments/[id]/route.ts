import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { ensureCommandSchema } from "@/lib/command-schema";
import { sendDiscordDm } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { awardProgressAchievements } from "@/lib/progression";
import { validateJsonWriteRequest } from "@/lib/request-security";
import { NextResponse } from "next/server";

type AssignmentRouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: AssignmentRouteContext) {
  const requestError = validateJsonWriteRequest(request, 8_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });
  const admin = await requireAdminCapability("MEMBERS");
  if (!admin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  await ensureCommandSchema();
  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { status?: string; evidence?: string; adminNote?: string } | null;
  const status = body?.status ?? "";
  if (!["ASSIGNED", "IN_PROGRESS", "COMPLETED", "FAILED"].includes(status)) return NextResponse.json({ error: "حالة المهمة غير صحيحة" }, { status: 400 });
  const current = await prisma.taskAssignment.findUnique({ where: { id }, include: { task: true, member: true } });
  if (!current) return NextResponse.json({ error: "التكليف غير موجود" }, { status: 404 });
  const firstCompletion = status === "COMPLETED" && current.status !== "COMPLETED";
  const assignment = await prisma.$transaction(async (tx) => {
    const updated = await tx.taskAssignment.update({ where: { id }, data: { status, evidence: body?.evidence?.trim().slice(0, 500) || current.evidence, adminNote: body?.adminNote?.trim().slice(0, 500) || current.adminNote, completedAt: status === "COMPLETED" ? new Date() : null } });
    if (firstCompletion) await tx.tokyoMember.update({ where: { id: current.memberId }, data: { commandPoints: { increment: current.task.points }, activityScore: Math.min(100, current.member.activityScore + Math.min(10, Math.max(1, Math.ceil(current.task.points / 20)))) } });
    return updated;
  });
  const awards = firstCompletion ? await awardProgressAchievements(current.memberId, admin.id) : [];
  await sendDiscordDm(current.member.discordId, status === "COMPLETED" ? `تم اعتماد إنجاز مهمة ${current.task.title}.\nأضيفت ${current.task.points} نقطة إلى ملفك.${awards.length ? `\nأوسمة جديدة: ${awards.map((item) => item.title).join("، ")}` : ""}` : `تم تحديث حالة مهمة ${current.task.title} إلى ${status}.`).catch(() => null);
  await createAdminLog({ action: "TASK_STATUS", title: `${current.task.title}: ${current.member.displayName} → ${status}`, details: firstCompletion ? `+${current.task.points} نقطة` : body?.adminNote, adminDiscordId: admin.id, targetType: "TASK", targetId: current.taskId, targetMemberId: current.memberId });
  return NextResponse.json({ success: true, assignment, awards });
}

import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { sendAdminEmbed } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { cleanOptionalText, validateJsonWriteRequest } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { ensureCommandSchema } from "@/lib/command-schema";

type OperationActionBody = {
  action?: string;
  status?: string;
  outcome?: string;
  participantId?: string;
  participantStatus?: string;
  participantRole?: string;
  note?: string;
};

const operationStatuses = new Set(["PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"]);
const participantStatuses = new Set(["INVITED", "CONFIRMED", "PRESENT", "ABSENT", "EXCUSED"]);
const participantRoles = new Set(["COMMANDER", "UNIT", "SUPPORT", "SECURITY", "MEDIA"]);

export async function PATCH(request: Request, context: RouteContext<"/api/admin/operations/[id]">) {
  const requestError = validateJsonWriteRequest(request, 16_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });

  const admin = await requireAdminCapability("OPERATIONS");
  if (!admin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  await ensureCommandSchema();

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as OperationActionBody | null;
  const operation = await prisma.operation.findUnique({ where: { id } });
  if (!operation) return NextResponse.json({ error: "العملية غير موجودة" }, { status: 404 });

  if (body?.action === "STATUS") {
    if (!operationStatuses.has(body.status ?? "")) return NextResponse.json({ error: "حالة العملية غير صحيحة" }, { status: 400 });
    const outcome = cleanOptionalText(body.outcome, 2_000);
    if (outcome === null) return NextResponse.json({ error: "نتيجة العملية طويلة جداً" }, { status: 400 });
    if (body.status === "COMPLETED" && !outcome) return NextResponse.json({ error: "اكتب نتيجة العملية قبل إغلاقها" }, { status: 400 });

    const updated = await prisma.operation.update({ where: { id }, data: { status: body.status, outcome: outcome || operation.outcome } });
    await createAdminLog({ action: "OPERATION_STATUS", title: `${operation.code} → ${body.status}`, details: outcome || undefined, adminDiscordId: admin.id, targetType: "OPERATION", targetId: id });
    await sendAdminEmbed({ title: `${operation.code} — ${body.status}`, fields: [{ name: "العملية", value: operation.title }, ...(outcome ? [{ name: "النتيجة", value: outcome }] : []), { name: "المسؤول", value: admin.name }] }).catch(() => null);
    return NextResponse.json({ success: true, operation: updated });
  }

  if (body?.action === "PARTICIPANT") {
    if (!body.participantId || !participantStatuses.has(body.participantStatus ?? "") || !participantRoles.has(body.participantRole ?? "")) {
      return NextResponse.json({ error: "بيانات المشارك غير صحيحة" }, { status: 400 });
    }
    const note = cleanOptionalText(body.note, 500);
    if (note === null) return NextResponse.json({ error: "الملاحظة طويلة جداً" }, { status: 400 });
    const participant = await prisma.operationParticipant.update({
      where: { id: body.participantId, operationId: id },
      data: {
        status: body.participantStatus,
        role: body.participantRole,
        note: note || null,
        checkedInAt: body.participantStatus === "PRESENT" ? new Date() : null,
      },
      include: { member: true },
    }).catch(() => null);
    if (!participant) return NextResponse.json({ error: "المشارك غير موجود" }, { status: 404 });
    await createAdminLog({ action: "OPERATION_ATTENDANCE", title: `${operation.code}: ${participant.member.displayName} → ${participant.status}`, details: note || undefined, adminDiscordId: admin.id, targetType: "OPERATION", targetId: id, targetMemberId: participant.memberId });
    return NextResponse.json({ success: true, participant });
  }

  return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
}

export async function DELETE(_request: Request, context: RouteContext<"/api/admin/operations/[id]">) {
  const admin = await requireAdminCapability("OPERATIONS");
  if (!admin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  await ensureCommandSchema();
  const { id } = await context.params;
  const operation = await prisma.operation.findUnique({ where: { id } });
  if (!operation) return NextResponse.json({ error: "العملية غير موجودة" }, { status: 404 });
  if (operation.status === "ACTIVE") return NextResponse.json({ error: "لا يمكن حذف عملية نشطة" }, { status: 409 });
  await prisma.operation.delete({ where: { id } });
  await createAdminLog({ action: "OPERATION_DELETE", title: `حذف ${operation.code}: ${operation.title}`, adminDiscordId: admin.id, targetType: "OPERATION", targetId: id });
  return NextResponse.json({ success: true });
}

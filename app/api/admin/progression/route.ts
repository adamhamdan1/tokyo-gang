import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { ensureCommandSchema } from "@/lib/command-schema";
import { sendDiscordDm } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { cleanBoundedText, cleanOptionalText, validateJsonWriteRequest } from "@/lib/request-security";
import { NextResponse } from "next/server";

type Body = { action?: string; title?: string; description?: string; category?: string; points?: number; dueAt?: string; memberIds?: string[]; seasonName?: string; startsAt?: string; endsAt?: string };

export async function POST(request: Request) {
  const requestError = validateJsonWriteRequest(request, 24_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });
  const admin = await requireAdminCapability("MEMBERS");
  if (!admin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  await ensureCommandSchema();
  const body = (await request.json().catch(() => null)) as Body | null;

  if (body?.action === "SEASON") {
    const name = cleanBoundedText(body.seasonName, 80);
    const startsAt = body.startsAt ? new Date(body.startsAt) : null;
    const endsAt = body.endsAt ? new Date(body.endsAt) : null;
    if (!name || !startsAt || !endsAt || Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) return NextResponse.json({ error: "بيانات الموسم غير صحيحة" }, { status: 400 });
    await prisma.tokyoSeason.updateMany({ where: { active: true }, data: { active: false } });
    const season = await prisma.tokyoSeason.create({ data: { name, startsAt, endsAt, createdBy: admin.id } });
    await createAdminLog({ action: "SEASON_CREATE", title: `بدء موسم ${name}`, adminDiscordId: admin.id, targetType: "SEASON", targetId: season.id });
    return NextResponse.json({ success: true, season });
  }

  const title = cleanBoundedText(body?.title, 120);
  const description = cleanBoundedText(body?.description, 1_000);
  const category = cleanOptionalText(body?.category, 40) || "GENERAL";
  const points = Math.round(Number(body?.points));
  const dueAt = body?.dueAt ? new Date(body.dueAt) : null;
  const memberIds = [...new Set((body?.memberIds ?? []).filter(Boolean))].slice(0, 80);
  if (!title || !description || !Number.isFinite(points) || points < 1 || points > 500 || !memberIds.length || (dueAt && Number.isNaN(dueAt.getTime()))) return NextResponse.json({ error: "أكمل بيانات المهمة واختر عضواً واحداً على الأقل" }, { status: 400 });
  const members = await prisma.tokyoMember.findMany({ where: { id: { in: memberIds }, inTokyoRole: true } });
  if (!members.length) return NextResponse.json({ error: "لم يتم العثور على أعضاء صالحين" }, { status: 400 });
  const task = await prisma.memberTask.create({
    data: { title, description, category, points, dueAt, createdBy: admin.id, assignments: { create: members.map((member) => ({ memberId: member.id })) } },
    include: { assignments: { include: { member: true } } },
  });
  await Promise.allSettled(members.map((member) => sendDiscordDm(member.discordId, `TOKYO TASKS\n\nتم تكليفك بمهمة جديدة: ${title}\nالنقاط: ${points}${dueAt ? `\nالموعد النهائي: ${dueAt.toLocaleString("ar", { timeZone: "Europe/Stockholm" })}` : ""}\n\n${description}`)));
  await createAdminLog({ action: "TASK_CREATE", title: `مهمة جديدة: ${title}`, details: `${points} نقطة — ${members.length} أعضاء`, adminDiscordId: admin.id, targetType: "TASK", targetId: task.id });
  return NextResponse.json({ success: true, task });
}

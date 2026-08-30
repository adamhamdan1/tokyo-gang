import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { sendAdminEmbed, sendDiscordDm } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { cleanBoundedText, cleanOptionalText, validateJsonWriteRequest } from "@/lib/request-security";
import { NextResponse } from "next/server";
import { ensureCommandSchema } from "@/lib/command-schema";

type CreateOperationBody = {
  title?: string;
  type?: string;
  objective?: string;
  location?: string;
  startsAt?: string;
  priority?: string;
  briefing?: string;
  commanderId?: string;
  participantIds?: string[];
};

const operationTypes = new Set(["MISSION", "MEETING", "TRAINING", "SECURITY", "MEDIA"]);
const priorities = new Set(["NORMAL", "HIGH", "CRITICAL"]);

function operationCode() {
  const now = new Date();
  const day = now.toISOString().slice(2, 10).replaceAll("-", "");
  return `OP-${day}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;
}

export async function POST(request: Request) {
  const requestError = validateJsonWriteRequest(request, 24_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });

  const admin = await requireAdminCapability("OPERATIONS");
  if (!admin) return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  await ensureCommandSchema();

  const body = (await request.json().catch(() => null)) as CreateOperationBody | null;
  const title = cleanBoundedText(body?.title, 120);
  const objective = cleanBoundedText(body?.objective, 1_000);
  const location = cleanOptionalText(body?.location, 160);
  const briefing = cleanOptionalText(body?.briefing, 2_000);
  const startsAt = body?.startsAt ? new Date(body.startsAt) : null;
  const type = operationTypes.has(body?.type ?? "") ? body!.type! : "MISSION";
  const priority = priorities.has(body?.priority ?? "") ? body!.priority! : "NORMAL";

  if (!title || !objective || location === null || briefing === null || !startsAt || Number.isNaN(startsAt.getTime())) {
    return NextResponse.json({ error: "اكتب عنوان العملية والهدف وحدد موعداً صحيحاً" }, { status: 400 });
  }

  const requestedIds = [...new Set([body?.commanderId, ...(body?.participantIds ?? [])].filter(Boolean) as string[])].slice(0, 60);
  const validMembers = requestedIds.length
    ? await prisma.tokyoMember.findMany({ where: { id: { in: requestedIds }, inTokyoRole: true } })
    : [];
  const validIds = new Set(validMembers.map((member) => member.id));
  const commanderId = body?.commanderId && validIds.has(body.commanderId) ? body.commanderId : null;
  const participantIds = [...new Set([...(body?.participantIds ?? []), commanderId].filter((id): id is string => Boolean(id) && validIds.has(id!)))];

  const operation = await prisma.operation.create({
    data: {
      code: operationCode(),
      title,
      type,
      objective,
      location: location || null,
      startsAt,
      priority,
      briefing: briefing || null,
      commanderId,
      createdBy: admin.id,
      participants: {
        create: participantIds.map((memberId) => ({
          memberId,
          role: memberId === commanderId ? "COMMANDER" : "UNIT",
        })),
      },
    },
    include: { commander: true, participants: { include: { member: true } } },
  });

  const dateText = startsAt.toLocaleString("ar", { timeZone: "Europe/Stockholm" });
  await Promise.allSettled(
    operation.participants.map(({ member, role }) =>
      sendDiscordDm(
        member.discordId,
        `TOKYO OPERATIONS\n\nتم تكليفك بعملية ${operation.code}\nالعنوان: ${title}\nالموعد: ${dateText}${location ? `\nالمكان: ${location}` : ""}\nدورك: ${role === "COMMANDER" ? "قائد العملية" : "فريق العملية"}\n\nراجع لوحة القيادة للتفاصيل.`
      )
    )
  );

  await sendAdminEmbed({
    title: `عملية جديدة ${operation.code}`,
    color: priority === "CRITICAL" ? 15_172_743 : priority === "HIGH" ? 16_607_744 : 2_282_478,
    fields: [
      { name: "العنوان", value: title, inline: true },
      { name: "النوع", value: type, inline: true },
      { name: "الموعد", value: dateText, inline: true },
      { name: "الهدف", value: objective },
      { name: "المشاركون", value: String(operation.participants.length), inline: true },
      { name: "أنشأها", value: admin.name, inline: true },
    ],
  }).catch(() => null);

  await createAdminLog({
    action: "OPERATION_CREATE",
    title: `إنشاء ${operation.code}: ${title}`,
    details: `${objective}\nالمشاركون: ${operation.participants.length}`,
    adminDiscordId: admin.id,
    targetType: "OPERATION",
    targetId: operation.id,
  });

  return NextResponse.json({ success: true, operation });
}

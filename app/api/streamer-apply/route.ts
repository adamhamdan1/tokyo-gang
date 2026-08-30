import { auth } from "@/auth";
import { STREAMER_APPLICATION_FLAG } from "@/lib/application-types";
import { isDiscordSnowflake, requireTokyoGuildMember, sendManagedWebhook } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { cleanBoundedText, isSafeHttpUrl, validateJsonWriteRequest } from "@/lib/request-security";
import { NextResponse } from "next/server";

type StreamerApplyBody = {
  name?: string;
  age?: string;
  platform?: string;
  channelUrl?: string;
  experience?: string;
  availability?: string;
  hasMic?: boolean;
  acceptedRules?: boolean;
};

export async function POST(request: Request) {
  const requestError = validateJsonWriteRequest(request, 16_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });

  const session = await auth();
  if (!session?.user?.id || !isDiscordSnowflake(session.user.id)) {
    return NextResponse.json({ error: "سجل دخول بحساب Discord من جديد ثم حاول مرة ثانية" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as StreamerApplyBody | null;
  const name = cleanBoundedText(body?.name, 80);
  const ageText = cleanBoundedText(body?.age, 3);
  const platform = cleanBoundedText(body?.platform, 40);
  const channelUrl = cleanBoundedText(body?.channelUrl, 300);
  const experience = cleanBoundedText(body?.experience, 1_000);
  const availability = cleanBoundedText(body?.availability, 500);
  const age = Number(ageText);

  if (!name || !ageText || !platform || !channelUrl || !experience || !availability) {
    return NextResponse.json({ error: "كمل جميع بيانات تقديم الستريمر" }, { status: 400 });
  }
  if (!Number.isFinite(age) || age < 16 || age > 99) {
    return NextResponse.json({ error: "الحد الأدنى للعمر هو 16" }, { status: 400 });
  }
  if (!isSafeHttpUrl(channelUrl)) {
    return NextResponse.json({ error: "رابط القناة غير صحيح" }, { status: 400 });
  }
  if (!body?.hasMic || !body.acceptedRules) {
    return NextResponse.json({ error: "لازم يكون عندك مايك وتوافق على تعليمات فريق المحتوى" }, { status: 400 });
  }

  try {
    await requireTokyoGuildMember(session.user.id);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "لازم تكون داخل سيرفر TOKYO" }, { status: 400 });
  }

  const blacklistEntry = await prisma.blacklistEntry.findFirst({ where: { discordId: session.user.id, active: true } });
  if (blacklistEntry) return NextResponse.json({ error: `أنت ممنوع من التقديم حالياً. السبب: ${blacklistEntry.reason}` }, { status: 403 });

  const user = await prisma.user.upsert({
    where: { discordId: session.user.id },
    update: { username: session.user.name ?? "Discord User", image: session.user.image ?? null },
    create: { discordId: session.user.id, username: session.user.name ?? "Discord User", image: session.user.image ?? null },
  });
  const existing = await prisma.application.findFirst({
    where: {
      userId: user.id,
      reviewFlag: STREAMER_APPLICATION_FLAG,
      status: { in: ["PENDING", "ACCEPTED", "INTERVIEW"] },
    },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    const error = existing.status === "ACCEPTED" ? "تقديم الستريمر الخاص بك مقبول بالفعل" : existing.status === "INTERVIEW" ? "تقديمك في مرحلة المقابلة بالفعل" : "عندك تقديم Streamer قيد المراجعة";
    return NextResponse.json({ error }, { status: 409 });
  }

  const application = await prisma.application.create({
    data: {
      name,
      age: ageText,
      city: platform,
      experience: channelUrl,
      reason: experience,
      dailyHours: availability,
      hasMic: true,
      acceptedRules: true,
      reviewFlag: STREAMER_APPLICATION_FLAG,
      userId: user.id,
    },
  });

  await sendManagedWebhook("APPLICATIONS", {
    embeds: [{
      title: "تقديم Streamer جديد",
      color: 5504024,
      fields: [
        { name: "الاسم", value: name },
        { name: "Discord", value: `${user.username} (${user.discordId})` },
        { name: "المنصة", value: platform },
        { name: "رابط القناة", value: channelUrl },
        { name: "الخبرة والمحتوى", value: experience },
        { name: "التفرغ", value: availability },
      ],
      timestamp: new Date().toISOString(),
    }],
  }).catch((error) => console.error("Streamer application webhook failed", error));

  return NextResponse.json({ success: true, application });
}

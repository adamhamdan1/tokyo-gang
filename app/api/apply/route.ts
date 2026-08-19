import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDiscordSnowflake, requireTokyoGuildMember, sendManagedWebhook } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { cleanBoundedText, validateJsonWriteRequest } from "@/lib/request-security";

type ApplyBody = {
  name?: string;
  age?: string;
  city?: string;
  experience?: string;
  reason?: string;
  dailyHours?: string;
  hasMic?: boolean;
  acceptedRules?: boolean;
};

export async function POST(req: Request) {
  const requestError = validateJsonWriteRequest(req, 16_000);
  if (requestError) return NextResponse.json({ error: requestError }, { status: 400 });

  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول بالديسكورد أولاً" },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as ApplyBody | null;

  const name = cleanBoundedText(body?.name, 80);
  const ageText = cleanBoundedText(body?.age, 3);
  const city = cleanBoundedText(body?.city, 80);
  const experience = cleanBoundedText(body?.experience, 1_000);
  const reason = cleanBoundedText(body?.reason, 1_000);
  const dailyHours = cleanBoundedText(body?.dailyHours, 80);

  if (!body || !name || !ageText || !city || !experience || !reason || !dailyHours) {
    return NextResponse.json(
      { error: "بيانات التقديم ناقصة" },
      { status: 400 }
    );
  }

  const age = Number(ageText);

  if (!Number.isFinite(age) || age < 16 || age > 99) {
    return NextResponse.json(
      { error: "الحد الأدنى للعمر هو 16" },
      { status: 400 }
    );
  }

  if (!body.acceptedRules) {
    return NextResponse.json(
      { error: "لازم توافق على قوانين العصابة قبل إرسال الطلب" },
      { status: 400 }
    );
  }

  if (!isDiscordSnowflake(session.user.id)) {
    return NextResponse.json(
      { error: "جلسة الديسكورد قديمة. سجل خروج من الموقع ثم سجل دخول بالديسكورد وقدم من جديد" },
      { status: 401 }
    );
  }

  try {
    await requireTokyoGuildMember(session.user.id);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل التحقق من سيرفر TOKYO" },
      { status: 400 }
    );
  }

  const blacklistEntry = await prisma.blacklistEntry.findFirst({
    where: {
      discordId: session.user.id,
      active: true,
    },
  });

  if (blacklistEntry) {
    return NextResponse.json(
      { error: `أنت ممنوع من التقديم حالياً. السبب: ${blacklistEntry.reason}` },
      { status: 403 }
    );
  }

  const username = session.user.name ?? "Discord User";
  const user = await prisma.user.upsert({
    where: {
      discordId: session.user.id,
    },
    update: {
      username,
      image: session.user.image ?? null,
    },
    create: {
      discordId: session.user.id,
      username,
      image: session.user.image ?? null,
    },
  });

  const existingApplication = await prisma.application.findFirst({
    where: {
      userId: user.id,
      status: {
        in: ["PENDING", "ACCEPTED", "INTERVIEW"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (existingApplication) {
    const message =
      existingApplication.status === "ACCEPTED"
        ? "طلبك مقبول بالفعل، ما تحتاج تقدم مرة ثانية"
        : existingApplication.status === "INTERVIEW"
          ? "طلبك في مرحلة المقابلة بالفعل"
        : "عندك طلب قيد المراجعة بالفعل";

    return NextResponse.json({ error: message }, { status: 409 });
  }

  const application = await prisma.application.create({
    data: {
      name,
      age: ageText,
      city,
      experience,
      reason,
      dailyHours,
      hasMic: body.hasMic ?? false,
      acceptedRules: body.acceptedRules,
      reviewFlag: age < 18 || !body.hasMic ? "Needs Review" : null,
      userId: user.id,
    },
  });

  try {
    await sendManagedWebhook("APPLICATIONS", {
      embeds: [
            {
              title: "طلب تقديم جديد",
              color: 16711680,
              fields: [
                {
                  name: "الاسم",
                  value: name,
                },
                {
                  name: "العمر",
                  value: ageText,
                },
                {
                  name: "المدينة",
                  value: city,
                },
                {
                  name: "حساب الديسكورد",
                  value: `${user.username} (${user.discordId})`,
                },
                {
                  name: "التحقق",
                  value: "موجود داخل سيرفر TOKYO",
                },
                {
                  name: "الخبرة",
                  value: experience,
                },
                {
                  name: "ساعات اللعب اليومية",
                  value: dailyHours,
                },
                {
                  name: "المايك",
                  value: body.hasMic ? "نعم" : "لا",
                },
                {
                  name: "السبب",
                  value: reason,
                },
              ],
              timestamp: new Date().toISOString(),
            },
      ],
    });
  } catch (error) {
    console.error("Discord webhook failed", error);
  }

  return NextResponse.json({ success: true, application });
}

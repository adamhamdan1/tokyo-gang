import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDiscordSnowflake, requireTokyoGuildMember } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول بالديسكورد أولاً" },
      { status: 401 }
    );
  }

  const body = (await req.json()) as ApplyBody;

  if (!body.name || !body.age || !body.city || !body.experience || !body.reason || !body.dailyHours) {
    return NextResponse.json(
      { error: "بيانات التقديم ناقصة" },
      { status: 400 }
    );
  }

  const age = Number(body.age);

  if (!Number.isFinite(age) || age < 16) {
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
      name: body.name,
      age: body.age,
      city: body.city,
      experience: body.experience,
      reason: body.reason,
      dailyHours: body.dailyHours,
      hasMic: body.hasMic ?? false,
      acceptedRules: body.acceptedRules,
      reviewFlag: age < 18 || !body.hasMic ? "Needs Review" : null,
      userId: user.id,
    },
  });

  if (process.env.DISCORD_WEBHOOK_URL) {
    try {
      await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [
            {
              title: "طلب تقديم جديد",
              color: 16711680,
              fields: [
                {
                  name: "الاسم",
                  value: body.name,
                },
                {
                  name: "العمر",
                  value: body.age,
                },
                {
                  name: "المدينة",
                  value: body.city,
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
                  value: body.experience,
                },
                {
                  name: "ساعات اللعب اليومية",
                  value: body.dailyHours,
                },
                {
                  name: "المايك",
                  value: body.hasMic ? "نعم" : "لا",
                },
                {
                  name: "السبب",
                  value: body.reason,
                },
              ],
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      });
    } catch (error) {
      console.error("Discord webhook failed", error);
    }
  }

  return NextResponse.json({ success: true, application });
}

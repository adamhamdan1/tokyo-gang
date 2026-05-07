import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type ApplyBody = {
  name?: string;
  age?: string;
  discord?: string;
  experience?: string;
  reason?: string;
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

  if (!body.name || !body.age || !body.experience || !body.reason) {
    return NextResponse.json(
      { error: "بيانات التقديم ناقصة" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      discordId: session.user.id,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "الحساب غير موجود" },
      { status: 404 }
    );
  }

  const application = await prisma.application.create({
    data: {
      name: body.name,
      age: body.age,
      experience: body.experience,
      reason: body.reason,
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
                  name: "Discord",
                  value: body.discord || user.discordId,
                },
                {
                  name: "حساب الديسكورد",
                  value: `${user.username} (${user.discordId})`,
                },
                {
                  name: "الخبرة",
                  value: body.experience,
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

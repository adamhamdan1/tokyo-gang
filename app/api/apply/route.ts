import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const data = await req.json();

  const webhook = process.env.DISCORD_WEBHOOK_URL;

  if (!webhook) {
    return NextResponse.json({ error: "Webhook missing" }, { status: 500 });
  }

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "TOKYO GANG Applications",
      embeds: [
        {
          title: "طلب انضمام جديد",
          color: 0xffffff,
          fields: [
            { name: "الاسم داخل اللعبة", value: data.name || "غير محدد" },
            { name: "العمر", value: data.age || "غير محدد" },
            { name: "Discord ID", value: data.discord || "غير محدد" },
            { name: "الخبرة", value: data.experience || "غير محدد" },
            { name: "سبب الانضمام", value: data.reason || "غير محدد" },
          ],
          footer: { text: "TOKYO GANG" },
        },
      ],
    }),
  });

  return NextResponse.json({ success: true });
}
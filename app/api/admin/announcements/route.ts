import { auth } from "@/auth";
import { sendAdminLog } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type AnnouncementBody = {
  title?: string;
  message?: string;
};

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

export async function POST(req: Request) {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const body = (await req.json()) as AnnouncementBody;

  if (!body.title?.trim() || !body.message?.trim()) {
    return NextResponse.json({ error: "بيانات الإعلان ناقصة" }, { status: 400 });
  }

  const announcement = await prisma.announcement.create({
    data: {
      title: body.title.trim(),
      message: body.message.trim(),
      createdBy: session.user.id,
    },
  });

  await sendAdminLog(
    `إعلان TOKYO جديد\nالعنوان: ${announcement.title}\nالأدمن: ${session.user.name ?? session.user.id}`
  ).catch((error) => console.error("Admin log failed", error));

  return NextResponse.json({ success: true, announcement });
}

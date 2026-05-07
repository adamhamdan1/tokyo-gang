import { auth } from "@/auth";
import { giveAcceptedRole, sendAdminLog } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

export async function POST() {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const applications = await prisma.application.findMany({
    where: { status: "ACCEPTED" },
    include: { user: true },
  });

  let synced = 0;

  for (const application of applications) {
    try {
      await giveAcceptedRole(application.user.discordId);
      synced += 1;
    } catch (error) {
      console.error("Sync role failed", application.user.discordId, error);
    }
  }

  await sendAdminLog(
    `مزامنة رتب TOKYO\nالأدمن: ${session.user.name ?? session.user.id}\nعدد التحديثات: ${synced}/${applications.length}`
  ).catch((error) => console.error("Admin log failed", error));

  return NextResponse.json({ success: true, synced, total: applications.length });
}

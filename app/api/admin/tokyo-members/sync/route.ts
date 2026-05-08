import { auth } from "@/auth";
import { listTokyoRoleMembers, sendAdminLog } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

async function requireAdmin() {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Access Denied" }, { status: 403 }),
    };
  }

  return { authorized: true as const, session };
}

export async function POST() {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const members = await listTokyoRoleMembers();
  const now = new Date();
  const discordIds = members.map((member) => member.id);

  await prisma.$transaction([
    ...members.map((member) =>
      prisma.tokyoMember.upsert({
        where: { discordId: member.id },
        update: {
          username: member.username,
          displayName: member.name,
          image: member.image,
          inTokyoRole: true,
          lastSyncedAt: now,
        },
        create: {
          discordId: member.id,
          username: member.username,
          displayName: member.name,
          image: member.image,
          inTokyoRole: true,
          lastSyncedAt: now,
        },
      })
    ),
    prisma.tokyoMember.updateMany({
      where: {
        discordId: {
          notIn: discordIds,
        },
      },
      data: {
        inTokyoRole: false,
        lastSyncedAt: now,
      },
    }),
  ]);

  await sendAdminLog(
    `مزامنة أعضاء TOKYO\nعدد الأعضاء: ${members.length}\nالأدمن: ${admin.session.user.name ?? admin.session.user.id}`
  ).catch((error) => console.error("Admin log failed", error));

  return NextResponse.json({ success: true, count: members.length });
}

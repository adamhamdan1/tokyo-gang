import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const honorSlots = [
  ["honorEliteMemberId", "Elite Member"],
  ["honorPlayerMemberId", "Player Of The Week"],
  ["honorStreamerMemberId", "Streamer Spotlight"],
  ["honorRecentMemberId", "Recent Accepted"],
] as const;

const memberSelect = {
  id: true,
  displayName: true,
  username: true,
  image: true,
  status: true,
  internalRank: true,
  behaviorScore: true,
};

export async function GET() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: ["spotlightMemberId", ...honorSlots.map(([key]) => key)],
      },
    },
  });
  const settingMap = new Map(settings.map((setting) => [setting.key, setting.value]));
  const spotlightId = settingMap.get("spotlightMemberId");

  const [member, honors] = await Promise.all([
    spotlightId ? prisma.tokyoMember.findUnique({ where: { id: spotlightId }, select: memberSelect }) : null,
    Promise.all(
      honorSlots.map(async ([key, label]) => {
        const memberId = settingMap.get(key);
        const honorMember = memberId ? await prisma.tokyoMember.findUnique({ where: { id: memberId }, select: memberSelect }) : null;

        return honorMember ? { label, member: honorMember } : null;
      })
    ),
  ]);

  return NextResponse.json({ member, honors: honors.filter(Boolean) }, { headers: { "Cache-Control": "no-store" } });
}

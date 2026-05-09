import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "spotlightMemberId" },
  });

  if (!setting?.value) {
    return NextResponse.json({ member: null }, { headers: { "Cache-Control": "no-store" } });
  }

  const member = await prisma.tokyoMember.findUnique({
    where: { id: setting.value },
    select: {
      id: true,
      displayName: true,
      username: true,
      image: true,
      status: true,
      internalRank: true,
      behaviorScore: true,
    },
  });

  return NextResponse.json({ member }, { headers: { "Cache-Control": "no-store" } });
}

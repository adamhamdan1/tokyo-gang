import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return NextResponse.json({ announcements });
}

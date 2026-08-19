import { prisma } from "@/lib/prisma";
import { parseStoredSiteContent } from "@/lib/site-content";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "siteContentV2" } }).catch(() => null);
  return NextResponse.json(
    { content: parseStoredSiteContent(setting?.value) },
    { headers: { "Cache-Control": "no-store" } }
  );
}

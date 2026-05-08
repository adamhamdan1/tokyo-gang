import { getGuildOnlineCount, listAcceptedRoleMembers } from "@/lib/discord";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [members, counts] = await Promise.all([
      listAcceptedRoleMembers(),
      getGuildOnlineCount(),
    ]);

    return NextResponse.json({
      members,
      onlineCount: counts.online,
      totalCount: counts.total,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Discord members failed", error);
    return NextResponse.json(
      { members: [], onlineCount: null, totalCount: null },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}

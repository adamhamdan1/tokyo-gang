import { getGuildOnlineCount, listOnlineAcceptedRoleMembers } from "@/lib/discord";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await syncTokyoMembersSafely();

    const [{ members, roleMemberCount }, counts] = await Promise.all([
      listOnlineAcceptedRoleMembers(),
      getGuildOnlineCount(),
    ]);

    return NextResponse.json({
      members,
      onlineCount: counts.online,
      tokyoOnlineCount: members.length,
      roleMemberCount,
    }, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error) {
    console.error("Discord members failed", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Discord members failed",
        members: null,
        onlineCount: null,
        tokyoOnlineCount: null,
        roleMemberCount: null,
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  }
}

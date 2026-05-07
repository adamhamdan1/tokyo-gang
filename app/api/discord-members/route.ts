import { getGuildOnlineCount, listAcceptedRoleMembers } from "@/lib/discord";
import { NextResponse } from "next/server";

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
    });
  } catch (error) {
    console.error("Discord members failed", error);
    return NextResponse.json({ members: [], onlineCount: null, totalCount: null });
  }
}

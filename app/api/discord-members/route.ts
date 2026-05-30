import { getGuildOnlineCount, listOnlineAcceptedRoleMembers } from "@/lib/discord";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
import { syncWarningsSafely } from "@/lib/warning-sync";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DiscordMembersPayload = {
  members: Awaited<ReturnType<typeof listOnlineAcceptedRoleMembers>>["members"];
  onlineCount: number | null;
  tokyoOnlineCount: number;
  roleMemberCount: number;
};

let cachedPayload: {
  data: DiscordMembersPayload;
  expiresAt: number;
} | null = null;

const DISCORD_MEMBERS_CACHE_MS = 10 * 1000;

export async function GET() {
  try {
    const now = Date.now();

    if (cachedPayload && cachedPayload.expiresAt > now) {
      return NextResponse.json(cachedPayload.data, {
        headers: {
          "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=20",
        },
      });
    }

    await Promise.all([
      syncTokyoMembersSafely(),
      syncWarningsSafely(),
    ]);

    const [{ members, roleMemberCount }, counts] = await Promise.all([
      listOnlineAcceptedRoleMembers(),
      getGuildOnlineCount(),
    ]);

    const data = {
      members,
      onlineCount: counts.online,
      tokyoOnlineCount: members.length,
      roleMemberCount,
    };

    cachedPayload = {
      data,
      expiresAt: now + DISCORD_MEMBERS_CACHE_MS,
    };

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=10, stale-while-revalidate=20",
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
          "Cache-Control": "public, max-age=0, s-maxage=5, stale-while-revalidate=10",
        },
      }
    );
  }
}

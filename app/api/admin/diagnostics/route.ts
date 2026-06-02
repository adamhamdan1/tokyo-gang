import { requireAdminCapability } from "@/lib/admin-permissions";
import { getConfiguredWarningRoleIds, getGuildOnlineCount, testDiscordSetup } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const admin = await requireAdminCapability("LOGS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const warningRoles = getConfiguredWarningRoleIds();
  const dbCheck = await prisma.siteSetting.count().then(() => true).catch(() => false);

  try {
    const [discord, counts] = await Promise.all([
      testDiscordSetup(),
      getGuildOnlineCount().catch(() => null),
    ]);

    return NextResponse.json({
      bot: "LINKED",
      guild: counts?.total ? `OK (${counts.total})` : "OK",
      acceptedRole: discord.roleName,
      warningRoles: [warningRoles.normal, warningRoles.high, warningRoles.dismissal].filter(Boolean).length,
      widget: counts?.online !== null && counts?.online !== undefined ? `OK (${counts.online} online)` : "UNKNOWN",
      database: dbCheck ? "OK" : "ERROR",
    });
  } catch (error) {
    return NextResponse.json({
      bot: "ERROR",
      guild: "UNKNOWN",
      acceptedRole: "UNKNOWN",
      warningRoles: [warningRoles.normal, warningRoles.high, warningRoles.dismissal].filter(Boolean).length,
      widget: "UNKNOWN",
      database: dbCheck ? "OK" : "ERROR",
      error: error instanceof Error ? error.message : "Unknown diagnostics error",
    });
  }
}

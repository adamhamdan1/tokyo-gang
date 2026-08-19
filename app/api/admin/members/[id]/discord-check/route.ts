import { getConfiguredWarningRoleIds, getTokyoGuildMember, resolveTokyoGangRole } from "@/lib/discord";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const admin = await requireAdminCapability("MEMBERS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const { id } = await context.params;
  const member = await prisma.tokyoMember.findUnique({ where: { id } });

  if (!member) {
    return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
  }

  const guildMember = await getTokyoGuildMember(member.discordId);
  const roles = guildMember?.roles ?? [];
  const tokyoRole = await resolveTokyoGangRole();
  const warningRoles = await getConfiguredWarningRoleIds();
  const warningState = roles.includes(warningRoles.dismissal ?? "")
    ? "DISMISSAL"
    : roles.includes(warningRoles.high ?? "")
      ? "HIGH"
      : roles.includes(warningRoles.normal ?? "")
        ? "NORMAL"
        : "NONE";

  return NextResponse.json({
    inServer: Boolean(guildMember),
    hasTokyoRole: roles.includes(tokyoRole.id),
    warningState,
    roleCount: roles.length,
  });
}

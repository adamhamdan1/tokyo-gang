import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import { inspectDiscordRole, invalidateTokyoRoleCache, isDiscordSnowflake } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { TOKYO_ROLE_OPTIONS } from "@/lib/tokyo-content";
import { saveTokyoRoleOverride } from "@/lib/tokyo-role-settings";
import { syncTokyoMembers } from "@/lib/tokyo-member-sync";
import { NextResponse } from "next/server";

const operationalRoleKeys = [
  "TOKYO_GANG",
  "ACCEPTED",
  "TRIAL",
  "SUMMON",
  "WARNING",
  "STRONG_WARNING",
  "DISMISSAL",
  "ON_LEAVE",
  "RANK_MEMBER",
  "RANK_SENIOR",
  "RANK_OFFICER",
  "RANK_DEPUTY",
  "RANK_LEADER",
] as const;

const allowedRoleKeys = new Set<string>([
  ...operationalRoleKeys,
  ...TOKYO_ROLE_OPTIONS.map((role) => role.key),
]);

type RoleBody = {
  roleKey?: string;
  roleId?: string;
};

export async function PUT(req: Request) {
  const admin = await requireAdminCapability("MEMBERS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const body = (await req.json()) as RoleBody;
  const roleKey = body.roleKey?.trim().toUpperCase() ?? "";
  const roleId = body.roleId?.trim() ?? "";

  if (!allowedRoleKeys.has(roleKey)) {
    return NextResponse.json({ error: "نوع الرتبة غير معروف" }, { status: 400 });
  }

  try {
    let roleName = "الإعداد التلقائي";
    let memberCount: number | null = null;

    if (roleId) {
      if (!isDiscordSnowflake(roleId)) {
        return NextResponse.json({ error: "Role ID غير صالح" }, { status: 400 });
      }

      const role = await inspectDiscordRole(roleId);

      if (!role) {
        return NextResponse.json({ error: "هذه الرتبة غير موجودة داخل سيرفر Discord" }, { status: 404 });
      }

      roleName = role.name;
      memberCount = role.memberCount;
    }

    await saveTokyoRoleOverride({ roleKey, roleId: roleId || undefined, adminId: admin.id });
    await prisma.siteSetting.delete({ where: { key: "tokyoGangRoleIdOverride" } }).catch(() => null);
    invalidateTokyoRoleCache();

    const sync = roleKey === "TOKYO_GANG" ? await syncTokyoMembers({ force: true }) : null;

    await createAdminLog({
      action: "DISCORD_ROLE_CONFIG",
      title: roleId ? `حفظ إعداد رتبة ${roleKey}` : `إزالة التثبيت اليدوي لرتبة ${roleKey}`,
      details: `${roleName}${memberCount === null ? "" : ` — ${memberCount} عضو`}`,
      adminDiscordId: admin.id,
      targetType: "SYSTEM",
      targetId: roleId || roleKey,
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      roleKey,
      roleName,
      memberCount,
      syncedMembers: sync?.count ?? null,
    });
  } catch (error) {
    console.error("Discord role configuration failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل حفظ إعداد الرتبة" },
      { status: 502 }
    );
  }
}

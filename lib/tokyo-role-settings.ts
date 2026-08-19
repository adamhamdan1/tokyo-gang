import { prisma } from "@/lib/prisma";
import { getTokyoDiscordConfig } from "@/lib/tokyo-env";

export const TOKYO_ROLE_OVERRIDES_KEY = "tokyoDiscordRoleOverrides";

export type TokyoRoleOverrides = Record<string, string>;

export async function getTokyoRoleOverrides(): Promise<TokyoRoleOverrides> {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: TOKYO_ROLE_OVERRIDES_KEY },
    select: { value: true },
  });

  if (!setting?.value) {
    const legacyConfig = getTokyoDiscordConfig();
    const seeded = Object.fromEntries(
      [
        ["ACCEPTED", legacyConfig.acceptedRoleId],
        ["TRIAL", legacyConfig.trialRoleId],
        ["SUMMON", legacyConfig.summonRoleId],
        ["WARNING", legacyConfig.warningRoleId],
        ["STRONG_WARNING", legacyConfig.strongWarningRoleId],
        ["DISMISSAL", legacyConfig.dismissalRoleId],
        ["ON_LEAVE", legacyConfig.leaveRoleId],
      ].filter((entry): entry is [string, string] => Boolean(entry[1]))
    );

    if (Object.keys(seeded).length > 0) {
      await prisma.siteSetting.create({
        data: {
          key: TOKYO_ROLE_OVERRIDES_KEY,
          value: JSON.stringify(seeded),
          updatedBy: "SYSTEM_MIGRATION",
        },
      }).catch(() => null);
    }

    return seeded;
  }

  try {
    const parsed = JSON.parse(setting.value) as TokyoRoleOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function saveTokyoRoleOverride(input: {
  roleKey: string;
  roleId?: string;
  adminId: string;
}) {
  const current = await getTokyoRoleOverrides();
  const next = { ...current };

  if (input.roleId) {
    next[input.roleKey] = input.roleId;
  } else {
    delete next[input.roleKey];
  }

  await prisma.siteSetting.upsert({
    where: { key: TOKYO_ROLE_OVERRIDES_KEY },
    update: { value: JSON.stringify(next), updatedBy: input.adminId },
    create: { key: TOKYO_ROLE_OVERRIDES_KEY, value: JSON.stringify(next), updatedBy: input.adminId },
  });

  return next;
}

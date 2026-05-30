import { createAdminLog } from "@/lib/admin-log";
import {
  downgradeStrongWarningRole,
  getConfiguredWarningRoleIds,
  getTokyoGuildMember,
  removeWarningRole,
  sendWarningSyncChannelEmbed,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";

type MemberWithWarnings = {
  id: string;
  discordId: string;
  displayName: string;
  image: string | null;
  inTokyoRole: boolean;
  status: string;
  warnings: Array<{
    id: string;
    reason: string;
    severity: string;
    details: string | null;
    createdAt: Date;
  }>;
};

const WARNING_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const WARNING_SYNC_INTERVAL_MS = 30 * 1000;
const WARNING_SYNC_LOG_DEDUPE_MS = 10 * 60 * 1000;
const SYNCED_WARNING_REASON = "مزامنة تلقائية من Discord";
const SYNCED_WARNING_DETAILS = "تم اكتشاف رتبة التحذير على العضو داخل Discord وإضافتها للموقع تلقائياً.";

const syncState: {
  inFlight: Promise<void> | null;
  lastSyncAt: number;
} = {
  inFlight: null,
  lastSyncAt: 0,
};

export function getWarningExpiryDate(warning: { createdAt: Date; severity: string }) {
  if (warning.severity === "DISMISSAL") {
    return null;
  }

  return new Date(warning.createdAt.getTime() + WARNING_TTL_MS);
}

export function getWarningTimeLeft(warning: { createdAt: Date; severity: string }) {
  const expiresAt = getWarningExpiryDate(warning);

  if (!expiresAt) {
    return null;
  }

  return Math.max(0, expiresAt.getTime() - Date.now());
}

export function formatWarningTimeLeft(ms: number | null) {
  if (ms === null) {
    return "لا ينتهي تلقائياً";
  }

  if (ms <= 0) {
    return "ينتهي قريباً";
  }

  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) {
    return `${days} يوم و ${hours} ساعة`;
  }

  return `${hours} ساعة`;
}

export async function syncWarningsSafely(options?: { force?: boolean; memberId?: string }) {
  try {
    await syncWarnings(options);
  } catch (error) {
    console.error("Warning sync failed", error);
  }
}

export async function syncWarnings(options?: { force?: boolean; memberId?: string }) {
  const now = Date.now();

  if (!options?.force && !options?.memberId && now - syncState.lastSyncAt < WARNING_SYNC_INTERVAL_MS) {
    return;
  }

  if (!options?.memberId && syncState.inFlight) {
    return syncState.inFlight;
  }

  const work = runWarningSync(options?.memberId).then(() => {
    if (!options?.memberId) {
      syncState.lastSyncAt = Date.now();
    }
  });

  if (!options?.memberId) {
    syncState.inFlight = work.finally(() => {
      syncState.inFlight = null;
    });

    return syncState.inFlight;
  }

  return work;
}

async function runWarningSync(memberId?: string) {
  const members = await prisma.tokyoMember.findMany({
    where: memberId
      ? { id: memberId }
      : {
          OR: [
            { inTokyoRole: true },
            {
              warnings: {
                some: {},
              },
            },
          ],
        },
    include: {
      warnings: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  for (const member of members) {
    await syncMemberWarnings(member);
  }
}

async function syncMemberWarnings(member: MemberWithWarnings) {
  let guildMember;

  try {
    guildMember = await getTokyoGuildMember(member.discordId);
  } catch (error) {
    console.error("Warning sync guild lookup failed", member.discordId, error);
    return;
  }

  const roleIds = getConfiguredWarningRoleIds();
  const memberRoleIds = new Set(guildMember?.roles ?? []);
  const hasNormalRole = roleIds.normal ? memberRoleIds.has(roleIds.normal) : false;
  const hasHighRole = roleIds.high ? memberRoleIds.has(roleIds.high) : false;
  const hasDismissalRole = roleIds.dismissal ? memberRoleIds.has(roleIds.dismissal) : false;

  await dedupeSyncedWarnings(member);
  await importManualDiscordWarnings(member, { hasNormalRole, hasHighRole, hasDismissalRole });

  for (const warning of member.warnings) {
    if (warning.severity === "NORMAL" && roleIds.normal && !hasNormalRole && !hasHighRole) {
      await deleteSyncedWarning(
        warning.id,
        member,
        "تم حذف التحذير العادي لأن رتبته غير موجودة في Discord",
        "REMOVED_FROM_DISCORD",
        "NORMAL"
      );
      continue;
    }

    if (warning.severity === "HIGH" && roleIds.high && !hasHighRole) {
      if (hasNormalRole) {
        await prisma.memberWarning.update({
          where: { id: warning.id },
          data: { severity: "NORMAL", createdAt: new Date() },
        });
        await logWarningSync(
          member,
          "تم تخفيض التحذير القوي لعادي لأن رتبة التحذير العادي موجودة فقط",
          "DOWNGRADED",
          "NORMAL"
        );
      } else {
        await deleteSyncedWarning(
          warning.id,
          member,
          "تم حذف التحذير القوي لأن رتبته غير موجودة في Discord",
          "REMOVED_FROM_DISCORD",
          "HIGH"
        );
      }
      continue;
    }

    if (warning.severity === "DISMISSAL" && roleIds.dismissal && !hasDismissalRole) {
      await deleteSyncedWarning(
        warning.id,
        member,
        "تم حذف سجل الفصل لأن رتبة الفصل غير موجودة في Discord",
        "REMOVED_FROM_DISCORD",
        "DISMISSAL"
      );
      continue;
    }

    await applyWarningExpiry(member, warning);
  }

  await normalizeMemberStatus(member.id);
}

async function importManualDiscordWarnings(
  member: MemberWithWarnings,
  roles: { hasNormalRole: boolean; hasHighRole: boolean; hasDismissalRole: boolean }
) {
  const existingSeverities = new Set(member.warnings.map((warning) => warning.severity));

  if (roles.hasDismissalRole && !existingSeverities.has("DISMISSAL")) {
    await createSyncedWarning(member, "DISMISSAL");
    return;
  }

  if (roles.hasHighRole && !existingSeverities.has("HIGH")) {
    await createSyncedWarning(member, "HIGH");
    return;
  }

  if (roles.hasNormalRole && !existingSeverities.has("NORMAL") && !existingSeverities.has("HIGH")) {
    await createSyncedWarning(member, "NORMAL");
  }
}

async function createSyncedWarning(member: MemberWithWarnings, severity: "NORMAL" | "HIGH" | "DISMISSAL") {
  const existingWarning = await prisma.memberWarning.findFirst({
    where: {
      memberId: member.id,
      severity,
    },
  });

  if (existingWarning) {
    return;
  }

  const warning = await prisma.memberWarning.create({
    data: {
      memberId: member.id,
      reason: SYNCED_WARNING_REASON,
      severity,
      details: SYNCED_WARNING_DETAILS,
      issuedBy: "DISCORD_SYNC",
    },
  });

  const duplicates = await prisma.memberWarning.findMany({
    where: {
      memberId: member.id,
      severity,
      issuedBy: "DISCORD_SYNC",
      reason: SYNCED_WARNING_REASON,
    },
    orderBy: { createdAt: "asc" },
  });
  const keepWarning = duplicates[0];
  const duplicateIds = duplicates.slice(1).map((duplicate) => duplicate.id);

  if (keepWarning?.id !== warning.id && duplicateIds.includes(warning.id)) {
    await prisma.memberWarning.delete({ where: { id: warning.id } }).catch(() => null);
    return;
  }

  if (duplicateIds.length > 0) {
    await prisma.memberWarning.deleteMany({
      where: {
        id: {
          in: duplicateIds,
        },
      },
    });
  }

  await prisma.tokyoMember.update({
    where: { id: member.id },
    data: {
      status: severity === "DISMISSAL" ? "DISMISSED" : severity === "HIGH" ? "HIGH_RISK" : "WARNED",
      inTokyoRole: severity === "DISMISSAL" ? false : member.inTokyoRole,
    },
  });

  await logWarningSync(
    member,
    `${SYNCED_WARNING_DETAILS}\nالنوع: ${severity}`,
    "CREATED_FROM_DISCORD",
    severity
  );
}

async function dedupeSyncedWarnings(member: MemberWithWarnings) {
  const syncedWarningsBySeverity = new Map<string, string[]>();

  for (const warning of member.warnings) {
    if (warning.reason !== SYNCED_WARNING_REASON) {
      continue;
    }

    syncedWarningsBySeverity.set(warning.severity, [...(syncedWarningsBySeverity.get(warning.severity) ?? []), warning.id]);
  }

  const duplicateIds = [...syncedWarningsBySeverity.values()].flatMap((ids) => ids.slice(1));

  if (duplicateIds.length === 0) {
    return;
  }

  await prisma.memberWarning.deleteMany({
    where: {
      id: {
        in: duplicateIds,
      },
    },
  });
}

async function applyWarningExpiry(
  member: { id: string; discordId: string; displayName: string },
  warning: { id: string; severity: string; createdAt: Date; reason: string }
) {
  const expiresAt = getWarningExpiryDate(warning);

  if (!expiresAt || expiresAt.getTime() > Date.now()) {
    return;
  }

  if (warning.severity === "HIGH") {
    await downgradeStrongWarningRole(member.discordId).catch((error) => console.error("Warning downgrade role failed", error));
    await prisma.memberWarning.update({
      where: { id: warning.id },
      data: {
        severity: "NORMAL",
        createdAt: new Date(),
        details: warning.reason ? `تم تخفيضه تلقائياً من تحذير قوي بعد 14 يوم. السبب الأصلي: ${warning.reason}` : undefined,
      },
    });
    await logWarningSync(member, "تم تخفيض تحذير قوي إلى تحذير عادي بعد 14 يوم", "DOWNGRADED", "NORMAL");
    return;
  }

  if (warning.severity === "NORMAL") {
    await removeWarningRole(member.discordId, "NORMAL").catch((error) => console.error("Warning expire remove role failed", error));
    await deleteSyncedWarning(warning.id, member, "انتهى التحذير العادي تلقائياً بعد 14 يوم", "EXPIRED", "NORMAL");
  }
}

async function deleteSyncedWarning(
  warningId: string,
  member: { id: string; discordId: string; displayName: string; image?: string | null },
  details: string,
  action: "REMOVED_FROM_DISCORD" | "EXPIRED",
  severity?: "NORMAL" | "HIGH" | "DISMISSAL"
) {
  await prisma.memberWarning.delete({
    where: { id: warningId },
  });
  await logWarningSync(member, details, action, severity);
}

async function normalizeMemberStatus(memberId: string) {
  const [member, warningCount] = await Promise.all([
    prisma.tokyoMember.findUnique({ where: { id: memberId } }),
    prisma.memberWarning.count({ where: { memberId } }),
  ]);

  if (!member) {
    return;
  }

  if (warningCount === 0 && member.inTokyoRole && ["WARNED", "HIGH_RISK", "FINAL_WARNING"].includes(member.status)) {
    await prisma.tokyoMember.update({
      where: { id: memberId },
      data: { status: "ACTIVE" },
    });
  }
}

async function logWarningSync(
  member: { id: string; discordId: string; displayName: string; image?: string | null },
  details: string,
  action: "CREATED_FROM_DISCORD" | "REMOVED_FROM_DISCORD" | "DOWNGRADED" | "EXPIRED",
  severity?: "NORMAL" | "HIGH" | "DISMISSAL"
) {
  const recentDuplicate = await prisma.adminLog.findFirst({
    where: {
      action: "WARNING_SYNC",
      details,
      targetMemberId: member.id,
      createdAt: {
        gte: new Date(Date.now() - WARNING_SYNC_LOG_DEDUPE_MS),
      },
    },
  });

  if (recentDuplicate) {
    return;
  }

  await createAdminLog({
    action: "WARNING_SYNC",
    title: `مزامنة تحذيرات ${member.displayName}`,
    details,
    targetType: "WARNING",
    targetMemberId: member.id,
  }).catch(() => null);

  await sendWarningSyncChannelEmbed({
    memberDiscordId: member.discordId,
    memberName: member.displayName,
    action,
    details,
    severity,
    avatarUrl: member.image,
  }).catch((error) => console.error("Warning sync channel log failed", error));
}

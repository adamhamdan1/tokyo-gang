import { createAdminLog } from "@/lib/admin-log";
import {
  downgradeStrongWarningRole,
  getConfiguredWarningRoleIds,
  getTokyoGuildMember,
  removeWarningRole,
} from "@/lib/discord";
import { prisma } from "@/lib/prisma";

type MemberWithWarnings = {
  id: string;
  discordId: string;
  displayName: string;
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
    where: {
      ...(memberId ? { id: memberId } : {}),
      warnings: {
        some: {},
      },
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
  const guildMember = await getTokyoGuildMember(member.discordId).catch(() => null);
  const roleIds = getConfiguredWarningRoleIds();
  const memberRoleIds = new Set(guildMember?.roles ?? []);
  const hasNormalRole = roleIds.normal ? memberRoleIds.has(roleIds.normal) : true;
  const hasHighRole = roleIds.high ? memberRoleIds.has(roleIds.high) : true;
  const hasDismissalRole = roleIds.dismissal ? memberRoleIds.has(roleIds.dismissal) : true;

  for (const warning of member.warnings) {
    if (warning.severity === "NORMAL" && !hasNormalRole && !hasHighRole) {
      await deleteSyncedWarning(warning.id, member.id, member.displayName, "تم حذف التحذير العادي لأن رتبته غير موجودة في Discord");
      continue;
    }

    if (warning.severity === "HIGH" && !hasHighRole) {
      if (hasNormalRole) {
        await prisma.memberWarning.update({
          where: { id: warning.id },
          data: { severity: "NORMAL", createdAt: new Date() },
        });
        await logWarningSync(member.id, member.displayName, "تم تخفيض التحذير القوي لعادي لأن رتبة التحذير العادي موجودة فقط");
      } else {
        await deleteSyncedWarning(warning.id, member.id, member.displayName, "تم حذف التحذير القوي لأن رتبته غير موجودة في Discord");
      }
      continue;
    }

    if (warning.severity === "DISMISSAL" && !hasDismissalRole) {
      await deleteSyncedWarning(warning.id, member.id, member.displayName, "تم حذف سجل الفصل لأن رتبة الفصل غير موجودة في Discord");
      continue;
    }

    await applyWarningExpiry(member, warning);
  }

  await normalizeMemberStatus(member.id);
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
    await logWarningSync(member.id, member.displayName, "تم تخفيض تحذير قوي إلى تحذير عادي بعد 14 يوم");
    return;
  }

  if (warning.severity === "NORMAL") {
    await removeWarningRole(member.discordId, "NORMAL").catch((error) => console.error("Warning expire remove role failed", error));
    await deleteSyncedWarning(warning.id, member.id, member.displayName, "انتهى التحذير العادي تلقائياً بعد 14 يوم");
  }
}

async function deleteSyncedWarning(warningId: string, memberId: string, memberName: string, details: string) {
  await prisma.memberWarning.delete({
    where: { id: warningId },
  });
  await logWarningSync(memberId, memberName, details);
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

async function logWarningSync(memberId: string, memberName: string, details: string) {
  await createAdminLog({
    action: "WARNING_SYNC",
    title: `مزامنة تحذيرات ${memberName}`,
    details,
    targetType: "WARNING",
    targetMemberId: memberId,
  }).catch(() => null);
}

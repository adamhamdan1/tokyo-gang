import { createAdminLog } from "@/lib/admin-log";
import { removeLeaveRole } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

let lastCleanupAt = 0;
let cleanupInFlight: Promise<void> | null = null;

export async function cleanupExpiredLeaves(options?: { force?: boolean }) {
  const nowMs = Date.now();

  if (!options?.force && nowMs - lastCleanupAt < 60 * 1000) {
    return;
  }

  if (cleanupInFlight) {
    return cleanupInFlight;
  }

  cleanupInFlight = runCleanup()
    .then(() => {
      lastCleanupAt = Date.now();
    })
    .finally(() => {
      cleanupInFlight = null;
    });

  return cleanupInFlight;
}

async function runCleanup() {
  const expiredLeaves = await prisma.leaveRequest.findMany({
    where: {
      status: "APPROVED",
      endsAt: {
        lte: new Date(),
      },
    },
    include: {
      member: true,
    },
  });

  for (const leave of expiredLeaves) {
    await removeLeaveRole(leave.member.discordId).catch((error) => console.error("Leave role cleanup failed", error));
    await prisma.$transaction([
      prisma.leaveRequest.update({
        where: { id: leave.id },
        data: { status: "EXPIRED" },
      }),
      prisma.tokyoMember.update({
        where: { id: leave.memberId },
        data: { status: leave.member.inTokyoRole ? "ACTIVE" : leave.member.status },
      }),
    ]);
    await createAdminLog({
      action: "LEAVE_EXPIRED",
      title: `انتهت إجازة ${leave.member.displayName}`,
      details: leave.reason,
      targetType: "LEAVE",
      targetId: leave.id,
      targetMemberId: leave.memberId,
    }).catch(() => null);
  }
}

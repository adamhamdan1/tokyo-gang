import { listTokyoRoleMembers } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

type SyncResult = {
  count: number;
  skipped: boolean;
  syncedAt: string;
};

const syncState: {
  inFlight: Promise<SyncResult> | null;
  lastSyncAt: number;
  lastResult: SyncResult | null;
} = {
  inFlight: null,
  lastSyncAt: 0,
  lastResult: null,
};

function getAutoSyncIntervalMs() {
  const seconds = Number(process.env.TOKYO_MEMBER_SYNC_INTERVAL_SECONDS ?? 30);
  const safeSeconds = Number.isFinite(seconds) ? Math.max(15, seconds) : 30;

  return safeSeconds * 1000;
}

async function runTokyoMemberSync() {
  const members = await listTokyoRoleMembers();
  const now = new Date();
  const discordIds = members.map((member) => member.id);

  await prisma.$transaction([
    ...members.map((member) =>
      prisma.tokyoMember.upsert({
        where: { discordId: member.id },
        update: {
          username: member.username,
          displayName: member.name,
          image: member.image,
          inTokyoRole: true,
          lastSyncedAt: now,
        },
        create: {
          discordId: member.id,
          username: member.username,
          displayName: member.name,
          image: member.image,
          inTokyoRole: true,
          status: "ACTIVE",
          lastSyncedAt: now,
        },
      })
    ),
    prisma.tokyoMember.updateMany({
      where: {
        discordId: {
          notIn: discordIds,
        },
      },
      data: {
        inTokyoRole: false,
        lastSyncedAt: now,
      },
    }),
  ]);

  return {
    count: members.length,
    skipped: false,
    syncedAt: now.toISOString(),
  };
}

export async function syncTokyoMembers(options?: { force?: boolean }) {
  const force = options?.force ?? false;
  const now = Date.now();

  if (!force && syncState.lastResult && now - syncState.lastSyncAt < getAutoSyncIntervalMs()) {
    return {
      ...syncState.lastResult,
      skipped: true,
    };
  }

  if (syncState.inFlight) {
    return syncState.inFlight;
  }

  syncState.inFlight = runTokyoMemberSync()
    .then((result) => {
      syncState.lastSyncAt = Date.now();
      syncState.lastResult = result;
      return result;
    })
    .finally(() => {
      syncState.inFlight = null;
    });

  return syncState.inFlight;
}

export async function syncTokyoMembersSafely() {
  try {
    return await syncTokyoMembers();
  } catch (error) {
    console.error("TOKYO member auto sync failed", error);
    return syncState.lastResult;
  }
}

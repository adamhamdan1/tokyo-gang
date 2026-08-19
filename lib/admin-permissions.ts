import { auth } from "@/auth";
import { getTokyoGuildMember, resolveCatalogRoleId } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { getTokyoRoleOption } from "@/lib/tokyo-content";

export type AdminCapability = "ALL" | "APPLICATIONS" | "WARNINGS" | "MEMBERS" | "LOGS";

export type AdminContext = {
  id: string;
  name: string;
  roles: string[];
  isOwner: boolean;
  capabilities: Record<AdminCapability, boolean>;
};

const capabilityRoleKeys: Record<Exclude<AdminCapability, "ALL">, string[]> = {
  APPLICATIONS: ["RECRUITMENT_MANAGER", "MANAGER", "STAFF"],
  WARNINGS: ["WARNINGS_MANAGER", "MANAGER", "STAFF"],
  MEMBERS: ["MANAGER", "STAFF"],
  LOGS: ["MANAGER", "STAFF"],
};

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

export async function getDatabaseAdminIds() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: "extraAdminDiscordIds" } });

  if (!setting?.value) {
    return [];
  }

  return setting.value.split(",").map((id) => id.trim()).filter(Boolean);
}

export async function getAllAdminIds() {
  return [...new Set([...getAdminIds(), ...(await getDatabaseAdminIds())])];
}

export function getOwnerAdminIds() {
  return getAdminIds();
}

async function getCapabilityRoleIds(keys: string[]) {
  const roleIds = await Promise.all(
    keys.map(async (key) => {
      const option = getTokyoRoleOption(key);

      if (!option) return null;

      return resolveCatalogRoleId(option.key, option.discordName).catch(() => null);
    })
  );

  return roleIds.filter(Boolean) as string[];
}

function hasAnyRole(memberRoleIds: string[], roleIds: string[]) {
  return roleIds.length > 0 && roleIds.some((roleId) => memberRoleIds.includes(roleId));
}

export async function getAdminContext(): Promise<AdminContext | null> {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const ownerAdminIds = getAdminIds();
  const extraAdminIds = await getDatabaseAdminIds();

  if (ownerAdminIds.includes(session.user.id)) {
    return {
      id: session.user.id,
      name: session.user.name ?? session.user.id,
      roles: [],
      isOwner: true,
      capabilities: {
        ALL: true,
        APPLICATIONS: true,
        WARNINGS: true,
        MEMBERS: true,
        LOGS: true,
      },
    };
  }

  if (extraAdminIds.includes(session.user.id)) {
    return {
      id: session.user.id,
      name: session.user.name ?? session.user.id,
      roles: [],
      isOwner: false,
      capabilities: {
        ALL: true,
        APPLICATIONS: true,
        WARNINGS: true,
        MEMBERS: true,
        LOGS: true,
      },
    };
  }

  const member = await getTokyoGuildMember(session.user.id).catch(() => null);
  const roles = member?.roles ?? [];
  const [applicationRoleIds, warningRoleIds, memberRoleIds, logRoleIds] = await Promise.all([
    getCapabilityRoleIds(capabilityRoleKeys.APPLICATIONS),
    getCapabilityRoleIds(capabilityRoleKeys.WARNINGS),
    getCapabilityRoleIds(capabilityRoleKeys.MEMBERS),
    getCapabilityRoleIds(capabilityRoleKeys.LOGS),
  ]);
  const capabilities = {
    ALL: false,
    APPLICATIONS: hasAnyRole(roles, applicationRoleIds),
    WARNINGS: hasAnyRole(roles, warningRoleIds),
    MEMBERS: hasAnyRole(roles, memberRoleIds),
    LOGS: hasAnyRole(roles, logRoleIds),
  };

  if (!Object.values(capabilities).some(Boolean)) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? session.user.id,
    roles,
    isOwner: false,
    capabilities,
  };
}

export async function requireAdminCapability(capability: AdminCapability) {
  const admin = await getAdminContext();

  if (!admin || (!admin.capabilities.ALL && !admin.capabilities[capability])) {
    return null;
  }

  return admin;
}

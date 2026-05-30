import { auth } from "@/auth";
import { getTokyoGuildMember } from "@/lib/discord";

export type AdminCapability = "ALL" | "APPLICATIONS" | "WARNINGS" | "MEMBERS" | "LOGS";

export type AdminContext = {
  id: string;
  name: string;
  roles: string[];
  capabilities: Record<AdminCapability, boolean>;
};

const capabilityRoleKeys: Record<Exclude<AdminCapability, "ALL">, string[]> = {
  APPLICATIONS: ["DISCORD_ROLE_RECRUITMENT_MANAGER_ID", "DISCORD_ROLE_MANAGER_ID", "DISCORD_ROLE_STAFF_ID"],
  WARNINGS: ["DISCORD_ROLE_WARNINGS_MANAGER_ID", "DISCORD_ROLE_MANAGER_ID", "DISCORD_ROLE_STAFF_ID"],
  MEMBERS: ["DISCORD_ROLE_MANAGER_ID", "DISCORD_ROLE_STAFF_ID"],
  LOGS: ["DISCORD_ROLE_MANAGER_ID", "DISCORD_ROLE_STAFF_ID"],
};

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

function getEnvRoleIds(keys: string[]) {
  return keys.map((key) => process.env[key]).filter(Boolean) as string[];
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

  if (ownerAdminIds.includes(session.user.id)) {
    return {
      id: session.user.id,
      name: session.user.name ?? session.user.id,
      roles: [],
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
  const capabilities = {
    ALL: false,
    APPLICATIONS: hasAnyRole(roles, getEnvRoleIds(capabilityRoleKeys.APPLICATIONS)),
    WARNINGS: hasAnyRole(roles, getEnvRoleIds(capabilityRoleKeys.WARNINGS)),
    MEMBERS: hasAnyRole(roles, getEnvRoleIds(capabilityRoleKeys.MEMBERS)),
    LOGS: hasAnyRole(roles, getEnvRoleIds(capabilityRoleKeys.LOGS)),
  };

  if (!Object.values(capabilities).some(Boolean)) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? session.user.id,
    roles,
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

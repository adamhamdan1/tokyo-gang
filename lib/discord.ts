import { getTokyoDiscordValue } from "@/lib/tokyo-env";
import { prisma } from "@/lib/prisma";
import { getTokyoRoleOverrides, saveTokyoRoleOverride } from "@/lib/tokyo-role-settings";

const DISCORD_API_BASE = "https://discord.com/api/v10";

type DiscordMember = {
  user?: {
    id?: string;
    username?: string;
    global_name?: string | null;
    avatar?: string | null;
  };
  nick?: string | null;
  roles?: string[];
};

type TokyoRoleMember = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  status?: "online" | "idle" | "dnd";
};

type DiscordWidgetMember = {
  id?: string;
  username?: string;
  status?: "online" | "idle" | "dnd" | "offline";
  avatar_url?: string;
};

type DiscordRole = {
  id: string;
  name: string;
};

let roleMembersCache: {
  roleId: string;
  members: TokyoRoleMember[];
  expiresAt: number;
} | null = null;

let tokyoRoleCache: {
  role: DiscordRole;
  source: "AUTO" | "MANUAL";
  expiresAt: number;
} | null = null;

let guildRolesCache: {
  roles: DiscordRole[];
  expiresAt: number;
} | null = null;

const ROLE_MEMBERS_CACHE_MS = 30 * 1000;
const TOKYO_ROLE_CACHE_MS = 5 * 60 * 1000;

function getBotHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN غير موجود في Cloudflare Secrets");
  }

  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

function getGuildId() {
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!guildId) {
    throw new Error("DISCORD_GUILD_ID غير موجود في Cloudflare Secrets");
  }

  return guildId;
}

async function getManagedRoleId(input: {
  roleKey: string;
  configKey?: Parameters<typeof getTokyoDiscordValue>[0];
  legacyName?: string;
  fallback?: string;
  label: string;
}) {
  const overrides = await getTokyoRoleOverrides();
  const overrideRoleId = overrides[input.roleKey];

  if (overrideRoleId) {
    const roles = await listGuildRoles();

    if (!roles.some((role) => role.id === overrideRoleId)) {
      throw new Error(`Role ID المحفوظ لرتبة ${input.label} لم يعد موجوداً في Discord`);
    }

    return overrideRoleId;
  }

  const configuredRoleId = input.configKey
    ? getTokyoDiscordValue(input.configKey, input.legacyName)
    : input.legacyName
      ? process.env[input.legacyName]
      : undefined;
  const roleId = configuredRoleId ?? input.fallback;

  if (!roleId) {
    throw new Error(`رتبة ${input.label} غير مضبوطة. أضف Role ID من لوحة الإدارة`);
  }

  return roleId;
}

function getAcceptedRoleId() {
  return getManagedRoleId({
    roleKey: "ACCEPTED",
    configKey: "acceptedRoleId",
    legacyName: "DISCORD_ACCEPTED_ROLE_ID",
    label: "القبول",
  });
}

export async function resolveTokyoGangRole() {
  const now = Date.now();
  const overrides = await getTokyoRoleOverrides();
  let overrideRoleId: string | null = overrides.TOKYO_GANG || null;

  if (
    tokyoRoleCache &&
    tokyoRoleCache.expiresAt > now &&
    ((overrideRoleId && tokyoRoleCache.source === "MANUAL" && tokyoRoleCache.role.id === overrideRoleId) ||
      (!overrideRoleId && tokyoRoleCache.source === "AUTO"))
  ) {
    return tokyoRoleCache.role;
  }

  const roles = await listGuildRoles();
  let overrideRole = overrideRoleId ? roles.find((role) => role.id === overrideRoleId) : null;

  if (overrideRoleId && !overrideRole) {
    await saveTokyoRoleOverride({ roleKey: "TOKYO_GANG", adminId: "SYSTEM_REPAIR" });
    overrideRoleId = null;
    overrideRole = null;
  }

  const preferredNames = ["Tokyo Gang ش", "Tokyo Gang", "TOKYO GANG"].map(normalizeRoleLookup);
  const roleByName =
    roles.find((role) => preferredNames.includes(normalizeRoleLookup(role.name))) ??
    roles.find((role) => {
      const normalized = normalizeRoleLookup(role.name);
      return normalized.includes("tokyo") && normalized.includes("gang") && !normalized.includes("online");
    });
  const role = overrideRole ?? roleByName;

  if (!role) {
    throw new Error("تعذر العثور على رتبة Tokyo Gang في Discord. تأكد من وجود رتبة باسم Tokyo Gang ش");
  }

  tokyoRoleCache = {
    role,
    source: overrideRole ? "MANUAL" : "AUTO",
    expiresAt: now + TOKYO_ROLE_CACHE_MS,
  };

  return role;
}

export function invalidateTokyoRoleCache() {
  tokyoRoleCache = null;
  roleMembersCache = null;
}

export async function inspectDiscordRole(roleId: string) {
  const roles = await listGuildRoles();
  const role = roles.find((item) => item.id === roleId);

  if (!role) return null;

  const members = await listRoleMembers(roleId);
  return {
    id: role.id,
    name: role.name,
    memberCount: members.length,
  };
}

async function getTokyoRoleId() {
  return (await resolveTokyoGangRole()).id;
}

function getTrialRoleId() {
  return getManagedRoleId({
    roleKey: "TRIAL",
    configKey: "trialRoleId",
    legacyName: "DISCORD_TRIAL_ROLE_ID",
    fallback: "1490418431344906320",
    label: "فترة التجربة",
  });
}

function getSummonRoleId() {
  return getManagedRoleId({
    roleKey: "SUMMON",
    configKey: "summonRoleId",
    legacyName: "DISCORD_SUMMON_ROLE_ID",
    label: "الاستدعاء",
  });
}

function getWarningRoleId() {
  return getManagedRoleId({
    roleKey: "WARNING",
    configKey: "warningRoleId",
    legacyName: "DISCORD_WARNING_ROLE_ID",
    label: "التحذير العادي",
  });
}

function getStrongWarningRoleId() {
  return getManagedRoleId({
    roleKey: "STRONG_WARNING",
    configKey: "strongWarningRoleId",
    legacyName: "DISCORD_STRONG_WARNING_ROLE_ID",
    label: "التحذير القوي",
  });
}

function getDismissalRoleId() {
  return getManagedRoleId({
    roleKey: "DISMISSAL",
    configKey: "dismissalRoleId",
    legacyName: "DISCORD_DISMISSAL_ROLE_ID",
    label: "الفصل",
  });
}

export async function getConfiguredWarningRoleIds() {
  return {
    normal: await getWarningRoleId().catch(() => undefined),
    high: await getStrongWarningRoleId().catch(() => undefined),
    dismissal: await getDismissalRoleId().catch(() => undefined),
  };
}

function getLeaveRoleId() {
  return getManagedRoleId({
    roleKey: "ON_LEAVE",
    configKey: "leaveRoleId",
    legacyName: "DISCORD_LEAVE_ROLE_ID",
    label: "الإجازة",
  });
}

function getRankRoleId(rank: string) {
  return getManagedRoleId({
    roleKey: `RANK_${rank}`,
    legacyName: `DISCORD_RANK_ROLE_${rank}_ID`,
    label: `الرتبة الداخلية ${rank}`,
  });
}

function getSummonChannelId() {
  const channelId = getTokyoDiscordValue("summonChannelId", "DISCORD_SUMMON_CHANNEL_ID");

  if (!channelId) {
    throw new Error("summonChannelId غير موجود داخل TOKYO_DISCORD_CONFIG");
  }

  return channelId;
}

function getComplaintLogChannelId() {
  return getTokyoDiscordValue("complaintLogChannelId", "DISCORD_COMPLAINT_LOG_CHANNEL_ID");
}

function getWarningLogChannelId() {
  return getTokyoDiscordValue("warningLogChannelId", "DISCORD_WARNING_LOG_CHANNEL_ID") ?? "1490246556857798817";
}

async function fetchDiscord(path: string, init?: RequestInit) {
  return fetch(`${DISCORD_API_BASE}${path}`, {
    ...init,
    headers: {
      ...getBotHeaders(),
      ...init?.headers,
    },
    cache: "no-store",
  });
}

export function getAvatarUrl(user?: DiscordMember["user"]) {
  if (!user?.id || !user.avatar) {
    return null;
  }

  return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`;
}

export function isDiscordSnowflake(value: string) {
  return /^\d{17,20}$/.test(value);
}

export async function getTokyoGuildMember(discordId: string) {
  if (!isDiscordSnowflake(discordId)) {
    throw new Error("هذا التقديم قديم وفيه Discord ID غير صحيح. ارفضه وخلي العضو يسجل خروج/دخول ثم يقدم من جديد");
  }

  const response = await fetchDiscord(`/guilds/${getGuildId()}/members/${discordId}`);

  if (response.status === 404) {
    return null;
  }

  if (response.status === 400) {
    throw new Error("Discord ID غير صحيح. خلي العضو يسجل خروج/دخول بالديسكورد ثم يقدم من جديد");
  }

  if (!response.ok) {
    throw new Error(`فشل التحقق من وجود العضو في السيرفر (${response.status})`);
  }

  return (await response.json()) as DiscordMember;
}

export async function requireTokyoGuildMember(discordId: string) {
  const member = await getTokyoGuildMember(discordId);

  if (!member) {
    throw new Error("لازم تكون داخل سيرفر TOKYO في الديسكورد قبل التقديم");
  }

  return member;
}

export async function giveAcceptedRole(discordId: string) {
  await giveRole(discordId, await getAcceptedRoleId(), "القبول");
}

export async function giveTrialRole(discordId: string) {
  await giveRole(discordId, await getTrialRoleId(), "فترة التجربة");
}

export async function giveSummonRole(discordId: string) {
  await giveRole(discordId, await getSummonRoleId(), "الاستدعاء");
}

export async function applyWarningRole(discordId: string, severity: "NORMAL" | "HIGH" | "DISMISSAL") {
  const roleIds = await getConfiguredWarningRoleIds();

  if (severity === "NORMAL") {
    if (!roleIds.normal) throw new Error("رتبة التحذير العادي غير مضبوطة من لوحة الإدارة");
    await giveRole(discordId, roleIds.normal, "التحذير العادي");
    return;
  }

  const warningRoleId = roleIds.normal;

  if (severity === "HIGH") {
    if (warningRoleId) {
      await removeRole(discordId, warningRoleId, "التحذير العادي");
    }

    if (!roleIds.high) throw new Error("رتبة التحذير القوي غير مضبوطة من لوحة الإدارة");
    await giveRole(discordId, roleIds.high, "التحذير القوي");
    return;
  }

  const strongWarningRoleId = roleIds.high;

  if (warningRoleId) {
    await removeRole(discordId, warningRoleId, "التحذير العادي");
  }

  if (strongWarningRoleId) {
    await removeRole(discordId, strongWarningRoleId, "التحذير القوي");
  }

  await removeTokyoRole(discordId);
  if (!roleIds.dismissal) throw new Error("رتبة الفصل غير مضبوطة من لوحة الإدارة");
  await giveRole(discordId, roleIds.dismissal, "الفصل");
}

export async function downgradeStrongWarningRole(discordId: string) {
  const roleIds = await getConfiguredWarningRoleIds();
  const strongWarningRoleId = roleIds.high;

  if (strongWarningRoleId) {
    await removeRole(discordId, strongWarningRoleId, "التحذير القوي");
  }

  if (!roleIds.normal) throw new Error("رتبة التحذير العادي غير مضبوطة من لوحة الإدارة");
  await giveRole(discordId, roleIds.normal, "التحذير العادي");
}

export async function removeWarningRole(discordId: string, severity: "NORMAL" | "HIGH" | "DISMISSAL") {
  const roleIds = await getConfiguredWarningRoleIds();

  if (severity === "NORMAL") {
    const warningRoleId = roleIds.normal;

    if (warningRoleId) {
      await removeRole(discordId, warningRoleId, "التحذير العادي");
    }

    return;
  }

  if (severity === "HIGH") {
    const strongWarningRoleId = roleIds.high;

    if (strongWarningRoleId) {
      await removeRole(discordId, strongWarningRoleId, "التحذير القوي");
    }

    return;
  }

  const dismissalRoleId = roleIds.dismissal;

  if (dismissalRoleId) {
    await removeRole(discordId, dismissalRoleId, "الفصل");
  }
}

export async function removeAllWarningRoles(discordId: string) {
  const configured = await getConfiguredWarningRoleIds();
  const roleIds = [
    [configured.normal, "التحذير العادي"],
    [configured.high, "التحذير القوي"],
    [configured.dismissal, "الفصل"],
  ] as const;

  for (const [roleId, label] of roleIds) {
    if (roleId) {
      await removeRole(discordId, roleId, label);
    }
  }
}

export async function removeTokyoRole(discordId: string) {
  await removeRole(discordId, await getTokyoRoleId(), "TOKYO");
}

export async function giveLeaveRole(discordId: string) {
  await giveRole(discordId, await getLeaveRoleId(), "الإجازة");
}

export async function removeLeaveRole(discordId: string) {
  await removeRole(discordId, await getLeaveRoleId(), "الإجازة");
}

export async function applyInternalRankRole(discordId: string, rank: string, previousRank?: string | null) {
  const normalizedRank = rank.toUpperCase();
  const roleId = await getRankRoleId(normalizedRank);
  const previousRoleId = previousRank ? await getRankRoleId(previousRank.toUpperCase()).catch(() => null) : null;

  if (previousRoleId && previousRoleId !== roleId) {
    await removeRole(discordId, previousRoleId, `رتبة ${previousRank}`);
  }

  await giveRole(discordId, roleId, `رتبة ${normalizedRank}`);

  return roleId;
}

export async function giveNamedRole(discordId: string, roleId: string, label: string) {
  await giveRole(discordId, roleId, label);
}

export async function removeNamedRole(discordId: string, roleId: string, label: string) {
  await removeRole(discordId, roleId, label);
}

export async function giveCatalogRole(discordId: string, roleKey: string, roleName: string) {
  const roleId = await resolveCatalogRoleId(roleKey, roleName);
  await giveRole(discordId, roleId, roleName);

  return roleId;
}

export async function removeCatalogRole(discordId: string, roleKey: string, roleName: string) {
  const roleId = await resolveCatalogRoleId(roleKey, roleName);
  await removeRole(discordId, roleId, roleName);

  return roleId;
}

export async function resolveCatalogRoleId(roleKey: string, roleName: string) {
  const roles = await listGuildRoles();
  const overrides = await getTokyoRoleOverrides();
  const overrideRoleId = overrides[roleKey];

  if (overrideRoleId) {
    const overrideRole = roles.find((role) => role.id === overrideRoleId);

    if (!overrideRole) {
      throw new Error(`Role ID المحفوظ لرتبة ${roleName} لم يعد موجوداً في Discord`);
    }

    return overrideRole.id;
  }

  const exactRole = roles.find((role) => role.name === roleName);

  if (exactRole) {
    return exactRole.id;
  }

  const normalizedName = normalizeRoleLookup(roleName);
  const looseRole = roles.find((role) => normalizeRoleLookup(role.name) === normalizedName);

  if (looseRole) {
    return looseRole.id;
  }

  throw new Error(`رتبة ${roleName} غير موجودة في Discord. أضفها بنفس الاسم حتى يلتقطها نظام TOKYO تلقائياً`);
}

async function listGuildRoles() {
  const now = Date.now();

  if (guildRolesCache && guildRolesCache.expiresAt > now) {
    return guildRolesCache.roles;
  }

  const response = await fetchDiscord(`/guilds/${getGuildId()}/roles`);

  if (!response.ok) {
    throw new Error(`فشل جلب رتب السيرفر من Discord (${response.status})`);
  }

  const roles = (await response.json()) as DiscordRole[];
  guildRolesCache = {
    roles,
    expiresAt: now + TOKYO_ROLE_CACHE_MS,
  };

  return roles;
}

function normalizeRoleLookup(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

async function giveRole(discordId: string, roleId: string, roleLabel: string) {
  await requireTokyoGuildMember(discordId);

  const response = await fetchDiscord(`/guilds/${getGuildId()}/members/${discordId}/roles/${roleId}`, {
    method: "PUT",
  });

  if (!response.ok) {
    throw new Error(
      `فشل إعطاء رتبة ${roleLabel}. تأكد أن البوت عنده Manage Roles وأن رتبته أعلى من الرتبة (${response.status})`
    );
  }
}

async function removeRole(discordId: string, roleId: string, roleLabel: string) {
  await requireTokyoGuildMember(discordId);

  const response = await fetchDiscord(`/guilds/${getGuildId()}/members/${discordId}/roles/${roleId}`, {
    method: "DELETE",
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(
      `فشل سحب رتبة ${roleLabel}. تأكد أن البوت عنده Manage Roles وأن رتبته أعلى من الرتبة (${response.status})`
    );
  }
}

export async function listAcceptedRoleMembers() {
  const members = await listGuildMembers();
  const acceptedRoleId = await getAcceptedRoleId();

  return members
    .filter((member) => member.roles?.includes(acceptedRoleId))
    .map((member) => ({
      id: member.user?.id ?? "",
      name: member.nick ?? member.user?.global_name ?? member.user?.username ?? "TOKYO Member",
      username: member.user?.username ?? "unknown",
      image: getAvatarUrl(member.user),
    }))
    .filter((member) => member.id) satisfies TokyoRoleMember[];
}

export async function listTokyoRoleMembers() {
  return listRoleMembers(await getTokyoRoleId());
}

export async function listOnlineAcceptedRoleMembers() {
  const tokyoRoleId = await getTokyoRoleId();
  const [roleMembers, widgetResponse] = await Promise.all([
    listCachedRoleMembers(tokyoRoleId),
    fetch(`${DISCORD_API_BASE}/guilds/${getGuildId()}/widget.json`, {
      cache: "no-store",
    }),
  ]);

  if (!widgetResponse.ok) {
    console.warn(`Discord Server Widget unavailable (${widgetResponse.status}); using role totals without member presence.`);

    return {
      members: [],
      roleMemberCount: roleMembers.length,
    };
  }

  const widget = (await widgetResponse.json()) as {
    members?: DiscordWidgetMember[];
  };
  const onlineMembers = matchWidgetMembersToRoleMembers(widget.members ?? [], roleMembers);

  return {
    members: onlineMembers.sort((first, second) => first.name.localeCompare(second.name)),
    roleMemberCount: roleMembers.length,
  };
}

async function listCachedRoleMembers(roleId: string) {
  const now = Date.now();

  if (roleMembersCache?.roleId === roleId && roleMembersCache.expiresAt > now) {
    return roleMembersCache.members;
  }

  const members = await listRoleMembers(roleId);
  roleMembersCache = {
    roleId,
    members,
    expiresAt: now + ROLE_MEMBERS_CACHE_MS,
  };

  return members;
}

async function listRoleMembers(roleId: string) {
  const members = await listGuildMembers();

  return members
    .filter((member) => member.roles?.includes(roleId))
    .map((member) => ({
      id: member.user?.id ?? "",
      name: member.nick ?? member.user?.global_name ?? member.user?.username ?? "TOKYO Member",
      username: member.user?.username ?? "unknown",
      image: getAvatarUrl(member.user),
    }))
    .filter((member) => member.id) satisfies TokyoRoleMember[];
}

async function listGuildMembers() {
  const members: DiscordMember[] = [];
  let after: string | null = null;

  while (true) {
    const params = new URLSearchParams({ limit: "1000" });

    if (after) {
      params.set("after", after);
    }

    const response = await fetchDiscord(`/guilds/${getGuildId()}/members?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`فشل جلب أعضاء السيرفر من Discord (${response.status})`);
    }

    const page = (await response.json()) as DiscordMember[];
    members.push(...page);

    if (page.length < 1000) {
      break;
    }

    const lastMemberId = page.at(-1)?.user?.id;

    if (!lastMemberId) {
      break;
    }

    after = lastMemberId;
  }

  return members;
}

function normalizeDiscordName(value: string) {
  return value
    .toLowerCase()
    .replace(/tokyo|tok|gang|كروز/gi, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function matchWidgetMembersToRoleMembers(
  widgetMembers: DiscordWidgetMember[],
  roleMembers: TokyoRoleMember[]
) {
  const roleCandidates = roleMembers.map((member) => ({
    member,
    keys: [member.name, member.username].map(normalizeDiscordName).filter(Boolean),
  }));
  const matchedIds = new Set<string>();
  const matchedMembers: TokyoRoleMember[] = [];

  for (const widgetMember of widgetMembers) {
    if (!widgetMember.username || widgetMember.status === "offline") continue;

    const widgetKey = normalizeDiscordName(widgetMember.username);
    if (!widgetKey) continue;

    const match = roleCandidates.find(({ member, keys }) => {
      if (matchedIds.has(member.id)) return false;
      return keys.some((key) => key === widgetKey || key.includes(widgetKey) || widgetKey.includes(key));
    });

    if (match) {
      matchedIds.add(match.member.id);
      matchedMembers.push({
        ...match.member,
        image: match.member.image ?? widgetMember.avatar_url ?? null,
        status: widgetMember.status,
      });
    }
  }

  return matchedMembers;
}

export async function getGuildOnlineCount() {
  const response = await fetchDiscord(`/guilds/${getGuildId()}?with_counts=true`);

  if (!response.ok) {
    throw new Error(`فشل جلب عدد المتصلين من Discord (${response.status})`);
  }

  const guild = (await response.json()) as {
    approximate_presence_count?: number;
    approximate_member_count?: number;
  };

  return {
    online: guild.approximate_presence_count ?? null,
    total: guild.approximate_member_count ?? null,
  };
}

export async function sendDiscordDm(discordId: string, content: string) {
  if (!isDiscordSnowflake(discordId)) {
    return;
  }

  const channelResponse = await fetchDiscord("/users/@me/channels", {
    method: "POST",
    body: JSON.stringify({
      recipient_id: discordId,
    }),
  });

  if (!channelResponse.ok) {
    throw new Error(`فشل فتح رسالة خاصة مع العضو (${channelResponse.status})`);
  }

  const channel = (await channelResponse.json()) as { id?: string };

  if (!channel.id) {
    throw new Error("Discord لم يرجع قناة DM صحيحة");
  }

  const messageResponse = await fetchDiscord(`/channels/${channel.id}/messages`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });

  if (!messageResponse.ok) {
    throw new Error(`فشل إرسال رسالة خاصة للعضو (${messageResponse.status})`);
  }
}

export async function sendSummonChannelMessage(content: string) {
  const response = await fetchDiscord(`/channels/${getSummonChannelId()}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
      allowed_mentions: {
        parse: ["users"],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`فشل إرسال رسالة في روم الاستدعاء (${response.status})`);
  }
}

export async function sendComplaintLogMessage(content: string) {
  const channelId = getComplaintLogChannelId();

  if (!channelId) {
    return;
  }

  const response = await fetchDiscord(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({
      content,
      allowed_mentions: {
        parse: ["users"],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`فشل إرسال لوق الشكوى في الديسكورد (${response.status})`);
  }
}

function safeEmbedValue(value: string, fallback = "غير محدد") {
  const trimmed = value.trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed.length > 1024 ? `${trimmed.slice(0, 1021)}...` : trimmed;
}

export async function sendWarningChannelEmbed(input: {
  memberDiscordId: string;
  memberName: string;
  severity: "NORMAL" | "HIGH" | "DISMISSAL";
  reason: string;
  details?: string;
  adminName: string;
  warningCount?: number;
  avatarUrl?: string | null;
}) {
  const severityConfig = {
    NORMAL: {
      title: "تحذير إداري",
      label: "تحذير عادي",
      color: 16_673_280,
      status: "تم تسجيل تحذير عادي على العضو.",
    },
    HIGH: {
      title: "تحذير قوي",
      label: "تحذير قوي",
      color: 16_443_672,
      status: "تم تسجيل تحذير قوي على العضو.",
    },
    DISMISSAL: {
      title: "فصل إداري",
      label: "فصل",
      color: 15_116_280,
      status: "تم فصل العضو إدارياً.",
    },
  } satisfies Record<
    "NORMAL" | "HIGH" | "DISMISSAL",
    { title: string; label: string; color: number; status: string }
  >;
  const config = severityConfig[input.severity];
  const fields = [
    {
      name: "العضو",
      value: `${input.memberName}\n<@${input.memberDiscordId}>`,
      inline: true,
    },
    {
      name: "نوع الإجراء",
      value: config.label,
      inline: true,
    },
    {
      name: "المسؤول",
      value: input.adminName,
      inline: true,
    },
    {
      name: "السبب",
      value: safeEmbedValue(input.reason),
    },
    ...(input.details
      ? [
          {
            name: "التفاصيل",
            value: safeEmbedValue(input.details),
          },
        ]
      : []),
    ...(typeof input.warningCount === "number"
      ? [
          {
            name: "عدد تحذيرات العضو",
            value: String(input.warningCount),
            inline: true,
          },
        ]
      : []),
  ];

  const response = await fetchDiscord(`/channels/${getWarningLogChannelId()}/messages`, {
    method: "POST",
    body: JSON.stringify({
      embeds: [
        {
          title: `TOKYO GANG | ${config.title}`,
          description: config.status,
          color: config.color,
          fields,
          thumbnail: input.avatarUrl ? { url: input.avatarUrl } : undefined,
          timestamp: new Date().toISOString(),
          footer: {
            text: "TOKYO GANG Warning System",
          },
        },
      ],
      allowed_mentions: {
        users: [input.memberDiscordId],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`فشل إرسال التحذير في روم التحذيرات (${response.status})`);
  }
}

export async function sendWarningSyncChannelEmbed(input: {
  memberDiscordId: string;
  memberName: string;
  action: "CREATED_FROM_DISCORD" | "REMOVED_FROM_DISCORD" | "DOWNGRADED" | "EXPIRED";
  details: string;
  severity?: "NORMAL" | "HIGH" | "DISMISSAL";
  avatarUrl?: string | null;
}) {
  const actionConfig = {
    CREATED_FROM_DISCORD: {
      title: "مزامنة تحذير من Discord",
      color: 65_535,
      status: "تم اكتشاف رتبة تحذير على العضو وإضافتها للموقع تلقائياً.",
    },
    REMOVED_FROM_DISCORD: {
      title: "إزالة تحذير بالمزامنة",
      color: 9_808_727,
      status: "تم حذف التحذير من الموقع لأن رتبة Discord لم تعد موجودة.",
    },
    DOWNGRADED: {
      title: "تنزيل تحذير تلقائي",
      color: 16_673_280,
      status: "تم تنزيل التحذير القوي إلى تحذير عادي حسب مدة النظام.",
    },
    EXPIRED: {
      title: "انتهاء تحذير تلقائي",
      color: 5_763_716,
      status: "انتهت مدة التحذير وتم تنظيفه تلقائياً.",
    },
  } satisfies Record<
    "CREATED_FROM_DISCORD" | "REMOVED_FROM_DISCORD" | "DOWNGRADED" | "EXPIRED",
    { title: string; color: number; status: string }
  >;
  const config = actionConfig[input.action];

  const response = await fetchDiscord(`/channels/${getWarningLogChannelId()}/messages`, {
    method: "POST",
    body: JSON.stringify({
      embeds: [
        {
          title: `TOKYO GANG | ${config.title}`,
          description: config.status,
          color: config.color,
          fields: [
            {
              name: "العضو",
              value: `${input.memberName}\n<@${input.memberDiscordId}>`,
              inline: true,
            },
            ...(input.severity
              ? [
                  {
                    name: "نوع التحذير",
                    value: input.severity,
                    inline: true,
                  },
                ]
              : []),
            {
              name: "التفاصيل",
              value: safeEmbedValue(input.details),
            },
          ],
          thumbnail: input.avatarUrl ? { url: input.avatarUrl } : undefined,
          timestamp: new Date().toISOString(),
          footer: {
            text: "TOKYO GANG Warning Sync",
          },
        },
      ],
      allowed_mentions: {
        users: [input.memberDiscordId],
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`فشل إرسال لوق مزامنة التحذيرات (${response.status})`);
  }
}

export type TokyoWebhookKind = "APPLICATIONS" | "ADMIN_LOG";

const webhookSettings = {
  APPLICATIONS: {
    urlKey: "tokyoApplicationWebhookUrl",
    channelKey: "tokyoApplicationWebhookChannelId",
    name: "TOKYO Applications",
    fallbackUrl: () => getTokyoDiscordValue("applicationWebhookUrl", "DISCORD_WEBHOOK_URL"),
    fallbackChannel: () => getTokyoDiscordValue("complaintLogChannelId", "DISCORD_COMPLAINT_LOG_CHANNEL_ID"),
  },
  ADMIN_LOG: {
    urlKey: "tokyoAdminLogWebhookUrl",
    channelKey: "tokyoAdminLogWebhookChannelId",
    name: "TOKYO Admin Logs",
    fallbackUrl: () => getTokyoDiscordValue("adminLogWebhookUrl", "DISCORD_ADMIN_LOG_WEBHOOK_URL"),
    fallbackChannel: () => getTokyoDiscordValue("warningLogChannelId", "DISCORD_WARNING_LOG_CHANNEL_ID"),
  },
} satisfies Record<TokyoWebhookKind, {
  urlKey: string;
  channelKey: string;
  name: string;
  fallbackUrl: () => string | undefined;
  fallbackChannel: () => string | undefined;
}>;

export async function getTokyoWebhookStatuses() {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: Object.values(webhookSettings).flatMap((setting) => [setting.urlKey, setting.channelKey]),
      },
    },
    select: { key: true, value: true },
  });
  const values = new Map(settings.map((setting) => [setting.key, setting.value]));

  return (Object.keys(webhookSettings) as TokyoWebhookKind[]).map((kind) => {
    const config = webhookSettings[kind];
    return {
      kind,
      configured: Boolean(values.get(config.urlKey) || config.fallbackUrl()),
      managed: Boolean(values.get(config.urlKey)),
      channelId: values.get(config.channelKey) || config.fallbackChannel() || "",
    };
  });
}

export async function ensureTokyoWebhooksSafely() {
  const statuses = await getTokyoWebhookStatuses();

  for (const status of statuses) {
    if (status.managed || !status.channelId) continue;

    try {
      await createManagedWebhook(status.kind, status.channelId, "SYSTEM_SETUP");
    } catch (error) {
      console.error(`تعذر إنشاء Webhook تلقائياً من نوع ${status.kind}:`, error);
    }
  }

  return getTokyoWebhookStatuses();
}

export async function createManagedWebhook(kind: TokyoWebhookKind, channelId: string, adminId: string) {
  const config = webhookSettings[kind];
  const response = await fetchDiscord(`/channels/${channelId}/webhooks`, {
    method: "POST",
    body: JSON.stringify({ name: config.name }),
  });

  if (!response.ok) {
    throw new Error(`فشل إنشاء Webhook في القناة (${response.status}). تأكد أن البوت يملك Manage Webhooks`);
  }

  const webhook = (await response.json()) as { id?: string; token?: string; name?: string };

  if (!webhook.id || !webhook.token) {
    throw new Error("Discord لم يرجع رابط Webhook صالح");
  }

  const webhookUrl = `https://discord.com/api/webhooks/${webhook.id}/${webhook.token}`;

  await prisma.$transaction([
    prisma.siteSetting.upsert({
      where: { key: config.urlKey },
      update: { value: webhookUrl, updatedBy: adminId },
      create: { key: config.urlKey, value: webhookUrl, updatedBy: adminId },
    }),
    prisma.siteSetting.upsert({
      where: { key: config.channelKey },
      update: { value: channelId, updatedBy: adminId },
      create: { key: config.channelKey, value: channelId, updatedBy: adminId },
    }),
  ]);

  return { name: webhook.name ?? config.name, channelId };
}

export async function sendManagedWebhook(kind: TokyoWebhookKind, payload: object) {
  const config = webhookSettings[kind];
  const stored = await prisma.siteSetting.findMany({
    where: { key: { in: [config.urlKey, config.channelKey] } },
    select: { key: true, value: true },
  });
  const values = new Map(stored.map((setting) => [setting.key, setting.value]));
  let webhookUrl = values.get(config.urlKey) || config.fallbackUrl();
  const send = (url: string) => fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (webhookUrl) {
    const response = await send(webhookUrl).catch(() => null);
    if (response?.ok) return true;
  }

  const channelId = values.get(config.channelKey) || config.fallbackChannel();
  if (!channelId) return false;

  await createManagedWebhook(kind, channelId, "SYSTEM");
  const refreshed = await prisma.siteSetting.findUnique({ where: { key: config.urlKey }, select: { value: true } });
  webhookUrl = refreshed?.value;

  if (!webhookUrl) return false;

  const retry = await send(webhookUrl);
  return retry.ok;
}

export async function sendAdminLog(content: string) {
  await sendManagedWebhook("ADMIN_LOG", { content });
}

export async function sendAdminEmbed(input: {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}) {
  await sendManagedWebhook("ADMIN_LOG", {
    embeds: [
        {
          title: input.title,
          description: input.description,
          color: input.color ?? 15_116_280,
          fields: input.fields,
          timestamp: new Date().toISOString(),
          footer: {
            text: "TOKYO GANG Admin System",
          },
        },
    ],
  });
}

export async function testDiscordSetup() {
  const guildResponse = await fetchDiscord(`/guilds/${getGuildId()}`);

  if (!guildResponse.ok) {
    throw new Error(`البوت لا يستطيع الوصول للسيرفر (${guildResponse.status})`);
  }

  const roleResponse = await fetchDiscord(`/guilds/${getGuildId()}/roles`);

  if (!roleResponse.ok) {
    throw new Error(`البوت لا يستطيع قراءة الرتب (${roleResponse.status})`);
  }

  const roles = (await roleResponse.json()) as Array<{ id: string; name: string }>;
  const acceptedRoleId = await getAcceptedRoleId();
  const acceptedRole = roles.find((role) => role.id === acceptedRoleId);

  if (!acceptedRole) {
    throw new Error("رتبة القبول غير موجودة داخل السيرفر");
  }

  return {
    ok: true,
    roleName: acceptedRole.name,
  };
}

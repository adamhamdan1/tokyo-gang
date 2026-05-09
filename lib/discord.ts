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

let roleMembersCache: {
  roleId: string;
  members: TokyoRoleMember[];
  expiresAt: number;
} | null = null;

const ROLE_MEMBERS_CACHE_MS = 30 * 1000;

function getBotHeaders() {
  const token = process.env.DISCORD_BOT_TOKEN;

  if (!token) {
    throw new Error("DISCORD_BOT_TOKEN غير موجود في Vercel Environment Variables");
  }

  return {
    Authorization: `Bot ${token}`,
    "Content-Type": "application/json",
  };
}

function getGuildId() {
  const guildId = process.env.DISCORD_GUILD_ID;

  if (!guildId) {
    throw new Error("DISCORD_GUILD_ID غير موجود في Vercel Environment Variables");
  }

  return guildId;
}

function getAcceptedRoleId() {
  const roleId = process.env.DISCORD_ACCEPTED_ROLE_ID;

  if (!roleId) {
    throw new Error("DISCORD_ACCEPTED_ROLE_ID غير موجود في Vercel Environment Variables");
  }

  return roleId;
}

function getTokyoOnlineRoleId() {
  return process.env.DISCORD_TOKYO_ONLINE_ROLE_ID ?? "1490246428218494976";
}

function getTokyoRoleId() {
  return process.env.DISCORD_TOKYO_ROLE_ID ?? getTokyoOnlineRoleId();
}

function getTrialRoleId() {
  return process.env.DISCORD_TRIAL_ROLE_ID ?? "1490418431344906320";
}

function getSummonRoleId() {
  const roleId = process.env.DISCORD_SUMMON_ROLE_ID;

  if (!roleId) {
    throw new Error("DISCORD_SUMMON_ROLE_ID غير موجود في Vercel Environment Variables");
  }

  return roleId;
}

function getWarningRoleId() {
  const roleId = process.env.DISCORD_WARNING_ROLE_ID;

  if (!roleId) {
    throw new Error("DISCORD_WARNING_ROLE_ID غير موجود في Vercel Environment Variables");
  }

  return roleId;
}

function getStrongWarningRoleId() {
  const roleId = process.env.DISCORD_STRONG_WARNING_ROLE_ID;

  if (!roleId) {
    throw new Error("DISCORD_STRONG_WARNING_ROLE_ID غير موجود في Vercel Environment Variables");
  }

  return roleId;
}

function getDismissalRoleId() {
  const roleId = process.env.DISCORD_DISMISSAL_ROLE_ID;

  if (!roleId) {
    throw new Error("DISCORD_DISMISSAL_ROLE_ID غير موجود في Vercel Environment Variables");
  }

  return roleId;
}

function getLeaveRoleId() {
  const roleId = process.env.DISCORD_LEAVE_ROLE_ID;

  if (!roleId) {
    throw new Error("DISCORD_LEAVE_ROLE_ID غير موجود في Vercel Environment Variables");
  }

  return roleId;
}

function getOptionalRoleId(key: string) {
  return process.env[key];
}

function getRankRoleId(rank: string) {
  return process.env[`DISCORD_RANK_ROLE_${rank}_ID`];
}

function getSummonChannelId() {
  const channelId = process.env.DISCORD_SUMMON_CHANNEL_ID;

  if (!channelId) {
    throw new Error("DISCORD_SUMMON_CHANNEL_ID غير موجود في Vercel Environment Variables");
  }

  return channelId;
}

function getComplaintLogChannelId() {
  return process.env.DISCORD_COMPLAINT_LOG_CHANNEL_ID;
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
  await giveRole(discordId, getAcceptedRoleId(), "القبول");
}

export async function giveTrialRole(discordId: string) {
  await giveRole(discordId, getTrialRoleId(), "فترة التجربة");
}

export async function giveSummonRole(discordId: string) {
  await giveRole(discordId, getSummonRoleId(), "الاستدعاء");
}

export async function applyWarningRole(discordId: string, severity: "NORMAL" | "HIGH" | "DISMISSAL") {
  if (severity === "NORMAL") {
    await giveRole(discordId, getWarningRoleId(), "التحذير العادي");
    return;
  }

  const warningRoleId = getOptionalRoleId("DISCORD_WARNING_ROLE_ID");

  if (severity === "HIGH") {
    if (warningRoleId) {
      await removeRole(discordId, warningRoleId, "التحذير العادي");
    }

    await giveRole(discordId, getStrongWarningRoleId(), "التحذير القوي");
    return;
  }

  const strongWarningRoleId = getOptionalRoleId("DISCORD_STRONG_WARNING_ROLE_ID");

  if (warningRoleId) {
    await removeRole(discordId, warningRoleId, "التحذير العادي");
  }

  if (strongWarningRoleId) {
    await removeRole(discordId, strongWarningRoleId, "التحذير القوي");
  }

  await removeTokyoRole(discordId);
  await giveRole(discordId, getDismissalRoleId(), "الفصل");
}

export async function removeTokyoRole(discordId: string) {
  await removeRole(discordId, getTokyoRoleId(), "TOKYO");
}

export async function giveLeaveRole(discordId: string) {
  await giveRole(discordId, getLeaveRoleId(), "الإجازة");
}

export async function removeLeaveRole(discordId: string) {
  await removeRole(discordId, getLeaveRoleId(), "الإجازة");
}

export async function applyInternalRankRole(discordId: string, rank: string, previousRank?: string | null) {
  const normalizedRank = rank.toUpperCase();
  const roleId = getRankRoleId(normalizedRank);

  if (!roleId) {
    throw new Error(`DISCORD_RANK_ROLE_${normalizedRank}_ID غير موجود في Vercel Environment Variables`);
  }

  const previousRoleId = previousRank ? getRankRoleId(previousRank.toUpperCase()) : null;

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
  const response = await fetchDiscord(`/guilds/${getGuildId()}/members?limit=1000`);

  if (!response.ok) {
    throw new Error(`فشل جلب أعضاء السيرفر من Discord (${response.status})`);
  }

  const members = (await response.json()) as DiscordMember[];
  const acceptedRoleId = getAcceptedRoleId();

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
  return listRoleMembers(getTokyoRoleId());
}

export async function listOnlineAcceptedRoleMembers() {
  const [roleMembers, widgetResponse] = await Promise.all([
    listCachedRoleMembers(getTokyoOnlineRoleId()),
    fetch(`${DISCORD_API_BASE}/guilds/${getGuildId()}/widget.json`, {
      cache: "no-store",
    }),
  ]);

  if (!widgetResponse.ok) {
    throw new Error(`فشل جلب أعضاء الديسكورد الأونلاين. فعل Server Widget من إعدادات السيرفر (${widgetResponse.status})`);
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
  const response = await fetchDiscord(`/guilds/${getGuildId()}/members?limit=1000`);

  if (!response.ok) {
    throw new Error(`فشل جلب أعضاء السيرفر من Discord (${response.status})`);
  }

  const members = (await response.json()) as DiscordMember[];

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

export async function sendAdminLog(content: string) {
  const webhookUrl = process.env.DISCORD_ADMIN_LOG_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content,
    }),
  });
}

export async function sendAdminEmbed(input: {
  title: string;
  description?: string;
  color?: number;
  fields?: Array<{ name: string; value: string; inline?: boolean }>;
}) {
  const webhookUrl = process.env.DISCORD_ADMIN_LOG_WEBHOOK_URL;

  if (!webhookUrl) {
    return;
  }

  await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
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
    }),
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
  const acceptedRole = roles.find((role) => role.id === getAcceptedRoleId());

  if (!acceptedRole) {
    throw new Error("رتبة القبول غير موجودة داخل السيرفر");
  }

  return {
    ok: true,
    roleName: acceptedRole.name,
  };
}

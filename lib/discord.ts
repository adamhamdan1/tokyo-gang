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
};

type DiscordWidgetMember = {
  id?: string;
  username?: string;
  status?: "online" | "idle" | "dnd" | "offline";
};

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
  await requireTokyoGuildMember(discordId);

  const response = await fetchDiscord(
    `/guilds/${getGuildId()}/members/${discordId}/roles/${getAcceptedRoleId()}`,
    {
      method: "PUT",
    }
  );

  if (!response.ok) {
    throw new Error(
      `فشل إعطاء الرتبة. تأكد أن البوت عنده Manage Roles وأن رتبته أعلى من رتبة القبول (${response.status})`
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

export async function listOnlineAcceptedRoleMembers() {
  const [roleMembers, widgetResponse] = await Promise.all([
    listRoleMembers(getTokyoOnlineRoleId()),
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
  const onlineIds = new Set(
    (widget.members ?? [])
      .filter((member) => member.id && member.status !== "offline")
      .map((member) => member.id!)
  );

  return {
    members: roleMembers
      .filter((member) => onlineIds.has(member.id))
      .sort((first, second) => first.name.localeCompare(second.name)),
    roleMemberCount: roleMembers.length,
  };
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

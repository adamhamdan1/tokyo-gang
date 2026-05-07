const DISCORD_API_BASE = "https://discord.com/api/v10";

type DiscordMember = {
  user?: {
    id?: string;
    username?: string;
  };
  roles?: string[];
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

export function isDiscordSnowflake(value: string) {
  return /^\d{17,20}$/.test(value);
}

export async function getTokyoGuildMember(discordId: string) {
  if (!isDiscordSnowflake(discordId)) {
    throw new Error("هذا التقديم قديم وفيه Discord ID غير صحيح. ارفضه وخلي العضو يسجل خروج/دخول ثم يقدم من جديد");
  }

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${getGuildId()}/members/${discordId}`,
    {
      headers: getBotHeaders(),
      cache: "no-store",
    }
  );

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

  const response = await fetch(
    `${DISCORD_API_BASE}/guilds/${getGuildId()}/members/${discordId}/roles/${getAcceptedRoleId()}`,
    {
      method: "PUT",
      headers: getBotHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      `فشل إعطاء الرتبة. تأكد أن البوت عنده Manage Roles وأن رتبته أعلى من رتبة القبول (${response.status})`
    );
  }
}

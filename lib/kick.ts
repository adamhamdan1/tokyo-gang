type KickAccessToken = {
  accessToken: string;
  expiresAt: number;
};

export type KickChannelStatus = {
  slug: string;
  isLive: boolean;
  title: string;
  viewers: number;
  thumbnail: string;
  startedAt: string | null;
};

type KickChannelResponse = {
  data?: Array<{
    slug?: string;
    stream_title?: string;
    stream?: {
      is_live?: boolean;
      viewer_count?: number;
      thumbnail?: string;
      start_time?: string;
    };
  }>;
};

let cachedToken: KickAccessToken | null = null;

export function isKickStatusConfigured() {
  return Boolean(process.env.KICK_CLIENT_ID?.trim() && process.env.KICK_CLIENT_SECRET?.trim());
}

async function getKickAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.KICK_CLIENT_ID?.trim();
  const clientSecret = process.env.KICK_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://id.kick.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Kick OAuth failed with ${response.status}`);
  }

  const body = (await response.json()) as {
    access_token?: string;
    expires_in?: number | string;
  };
  if (!body.access_token) throw new Error("Kick OAuth returned no token");

  const expiresIn = Math.max(120, Number(body.expires_in) || 3_600);
  cachedToken = {
    accessToken: body.access_token,
    expiresAt: Date.now() + expiresIn * 1_000,
  };
  return cachedToken.accessToken;
}

export async function getKickChannelStatuses(slugs: string[]) {
  const cleanSlugs = [...new Set(slugs.map((slug) => slug.trim().toLowerCase()).filter(Boolean))].slice(0, 50);
  if (!cleanSlugs.length) return [];

  const accessToken = await getKickAccessToken();
  if (!accessToken) return [];

  const query = new URLSearchParams();
  cleanSlugs.forEach((slug) => query.append("slug", slug));
  const response = await fetch(`https://api.kick.com/public/v1/channels?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    signal: AbortSignal.timeout(8_000),
    cache: "no-store",
  });

  if (!response.ok) {
    if (response.status === 401) cachedToken = null;
    throw new Error(`Kick channels failed with ${response.status}`);
  }

  const body = (await response.json()) as KickChannelResponse;
  return (body.data ?? []).map((channel): KickChannelStatus => ({
    slug: channel.slug?.toLowerCase() ?? "",
    isLive: Boolean(channel.stream?.is_live),
    title: channel.stream_title?.trim() ?? "",
    viewers: Math.max(0, Number(channel.stream?.viewer_count) || 0),
    thumbnail: channel.stream?.thumbnail?.trim() ?? "",
    startedAt: channel.stream?.start_time?.trim() || null,
  })).filter((channel) => channel.slug);
}

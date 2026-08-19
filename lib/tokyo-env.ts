type TokyoDiscordConfig = {
  gangRoleId?: string;
  acceptedRoleId?: string;
  trialRoleId?: string;
  summonRoleId?: string;
  warningRoleId?: string;
  strongWarningRoleId?: string;
  dismissalRoleId?: string;
  leaveRoleId?: string;
  summonChannelId?: string;
  complaintLogChannelId?: string;
  warningLogChannelId?: string;
  applicationWebhookUrl?: string;
  adminLogWebhookUrl?: string;
};

let cachedSource: string | undefined;
let cachedConfig: TokyoDiscordConfig = {};

export function getTokyoDiscordConfig() {
  const source = process.env.TOKYO_DISCORD_CONFIG;

  if (!source) return {};
  if (source === cachedSource) return cachedConfig;

  try {
    const parsed = JSON.parse(source) as TokyoDiscordConfig;
    cachedSource = source;
    cachedConfig = parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    throw new Error("TOKYO_DISCORD_CONFIG غير صالح. يجب أن يكون JSON صحيحاً");
  }

  return cachedConfig;
}

export function getTokyoDiscordValue(
  key: keyof TokyoDiscordConfig,
  legacyName?: string
) {
  const value = getTokyoDiscordConfig()[key];

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return legacyName ? process.env[legacyName]?.trim() : undefined;
}

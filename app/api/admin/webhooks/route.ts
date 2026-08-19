import { createAdminLog } from "@/lib/admin-log";
import { requireAdminCapability } from "@/lib/admin-permissions";
import {
  createManagedWebhook,
  getTokyoWebhookStatuses,
  isDiscordSnowflake,
  type TokyoWebhookKind,
} from "@/lib/discord";
import { NextResponse } from "next/server";

type WebhookBody = {
  kind?: TokyoWebhookKind;
  channelId?: string;
};

export async function GET() {
  const admin = await requireAdminCapability("LOGS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  return NextResponse.json({ webhooks: await getTokyoWebhookStatuses() });
}

export async function POST(req: Request) {
  const admin = await requireAdminCapability("LOGS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const body = (await req.json()) as WebhookBody;
  const kind = body.kind;
  const channelId = body.channelId?.trim() ?? "";

  if (kind !== "APPLICATIONS" && kind !== "ADMIN_LOG") {
    return NextResponse.json({ error: "نوع Webhook غير معروف" }, { status: 400 });
  }

  if (!isDiscordSnowflake(channelId)) {
    return NextResponse.json({ error: "Channel ID غير صالح" }, { status: 400 });
  }

  try {
    const webhook = await createManagedWebhook(kind, channelId, admin.id);

    await createAdminLog({
      action: "WEBHOOK_CREATE",
      title: `إنشاء ${kind === "APPLICATIONS" ? "Webhook التقديمات" : "Webhook سجل الإدارة"}`,
      details: webhook.name,
      adminDiscordId: admin.id,
      targetType: "SYSTEM",
      targetId: channelId,
    }).catch(() => null);

    return NextResponse.json({ success: true, webhook, webhooks: await getTokyoWebhookStatuses() });
  } catch (error) {
    console.error("Webhook creation failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل إنشاء Webhook" },
      { status: 502 }
    );
  }
}

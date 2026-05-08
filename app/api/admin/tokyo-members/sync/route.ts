import { auth } from "@/auth";
import { sendAdminLog } from "@/lib/discord";
import { syncTokyoMembers } from "@/lib/tokyo-member-sync";
import { NextResponse } from "next/server";

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

async function requireAdmin() {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return {
      authorized: false as const,
      response: NextResponse.json({ error: "Access Denied" }, { status: 403 }),
    };
  }

  return { authorized: true as const, session };
}

export async function POST() {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const result = await syncTokyoMembers({ force: true });

  await sendAdminLog(
    `مزامنة أعضاء TOKYO\nعدد الأعضاء: ${result.count}\nالأدمن: ${admin.session.user.name ?? admin.session.user.id}`
  ).catch((error) => console.error("Admin log failed", error));

  return NextResponse.json({ success: true, count: result.count, syncedAt: result.syncedAt });
}

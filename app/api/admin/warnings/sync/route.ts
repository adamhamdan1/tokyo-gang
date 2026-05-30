import { auth } from "@/auth";
import { syncWarningsSafely } from "@/lib/warning-sync";
import { NextResponse } from "next/server";

type SyncBody = {
  memberId?: string;
};

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

export async function POST(req: Request) {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as SyncBody;
  await syncWarningsSafely({ force: true, memberId: body.memberId });

  return NextResponse.json({ success: true });
}

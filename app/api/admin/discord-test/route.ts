import { auth } from "@/auth";
import { testDiscordSetup } from "@/lib/discord";
import { NextResponse } from "next/server";

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

export async function GET() {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const result = await testDiscordSetup();
    return NextResponse.json({
      success: true,
      message: `Discord جاهز. رتبة القبول: ${result.roleName}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشل اختبار Discord" },
      { status: 400 }
    );
  }
}

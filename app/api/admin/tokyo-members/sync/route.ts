import { requireAdminCapability } from "@/lib/admin-permissions";
import { sendAdminLog } from "@/lib/discord";
import { syncTokyoMembers } from "@/lib/tokyo-member-sync";
import { NextResponse } from "next/server";

export async function POST() {
  const admin = await requireAdminCapability("MEMBERS");

  if (!admin) {
    return NextResponse.json({ error: "Access Denied" }, { status: 403 });
  }

  try {
    const result = await syncTokyoMembers({ force: true });

    await sendAdminLog(
      `مزامنة أعضاء TOKYO\nعدد الأعضاء: ${result.count}\nالأدمن: ${admin.name}`
    ).catch((error) => console.error("Admin log failed", error));

    return NextResponse.json({ success: true, count: result.count, syncedAt: result.syncedAt });
  } catch (error) {
    console.error("TOKYO member sync failed", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "فشلت مزامنة أعضاء العصابة" },
      { status: 502 }
    );
  }
}

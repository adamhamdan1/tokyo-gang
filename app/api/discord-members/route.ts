import { listAcceptedRoleMembers } from "@/lib/discord";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const members = await listAcceptedRoleMembers();
    return NextResponse.json({ members });
  } catch (error) {
    console.error("Discord members failed", error);
    return NextResponse.json({ members: [] });
  }
}

import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { sendAdminLog } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateBody = {
  status?: string;
  adminNote?: string;
};

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

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const { id } = await context.params;
  const body = (await req.json()) as UpdateBody;

  if (!body.status || !["OPEN", "REVIEWING", "RESOLVED", "DISMISSED"].includes(body.status)) {
    return NextResponse.json({ error: "حالة شكوى غير صحيحة" }, { status: 400 });
  }

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      status: body.status,
      adminNote: body.adminNote?.trim() || undefined,
      reviewedBy: admin.session.user.id,
    },
    include: {
      reporter: true,
      accused: true,
    },
  });

  await sendAdminLog(
    `تحديث شكوى TOKYO\nالحالة: ${body.status}\nالمشتكي: ${complaint.reporter.displayName}\nالمشكو عليه: ${complaint.accused.displayName}\nالأدمن: ${admin.session.user.name ?? admin.session.user.id}${
      body.adminNote ? `\nملاحظة: ${body.adminNote}` : ""
    }`
  ).catch((error) => console.error("Complaint update log failed", error));

  await createAdminLog({
    action: "COMPLAINT_UPDATE",
    title: `تحديث شكوى: ${body.status}`,
    details: `المشتكي: ${complaint.reporter.displayName}\nالمشكو عليه: ${complaint.accused.displayName}${
      body.adminNote ? `\nملاحظة: ${body.adminNote}` : ""
    }`,
    adminDiscordId: admin.session.user.id,
    targetType: "COMPLAINT",
    targetId: complaint.id,
    targetMemberId: complaint.accused.id,
  }).catch((error) => console.error("Complaint db log failed", error));

  return NextResponse.json({ success: true, complaint });
}

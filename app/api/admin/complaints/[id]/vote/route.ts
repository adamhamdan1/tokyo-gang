import { auth } from "@/auth";
import { createAdminLog } from "@/lib/admin-log";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type VoteBody = {
  vote?: string;
  note?: string;
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

export async function POST(req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const { id } = await context.params;
  const body = (await req.json()) as VoteBody;
  const vote = body.vote === "AGAINST" ? "AGAINST" : body.vote === "ABSTAIN" ? "ABSTAIN" : "FOR";

  const complaint = await prisma.complaint.findUnique({
    where: { id },
    include: { accused: true },
  });

  if (!complaint) {
    return NextResponse.json({ error: "الشكوى غير موجودة" }, { status: 404 });
  }

  const savedVote = await prisma.complaintVote.upsert({
    where: {
      complaintId_adminDiscordId: {
        complaintId: id,
        adminDiscordId: admin.session.user.id,
      },
    },
    update: {
      vote,
      note: body.note?.trim(),
    },
    create: {
      complaintId: id,
      adminDiscordId: admin.session.user.id,
      vote,
      note: body.note?.trim(),
    },
  });

  await createAdminLog({
    action: "COMPLAINT_VOTE",
    title: `تصويت شكوى: ${vote}`,
    details: body.note?.trim(),
    adminDiscordId: admin.session.user.id,
    targetType: "COMPLAINT",
    targetId: id,
    targetMemberId: complaint.accused.id,
  });

  return NextResponse.json({ success: true, vote: savedVote });
}

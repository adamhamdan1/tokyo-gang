import { auth } from "@/auth";
import { giveAcceptedRole } from "@/lib/discord";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateBody = {
  status?: string;
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
      response: NextResponse.json(
      {
        error: "Access Denied",
        currentDiscordId: session?.user?.id ?? null,
      },
      { status: 403 }
      ),
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

  if (!body.status || !["ACCEPTED", "REJECTED", "PENDING"].includes(body.status)) {
    return NextResponse.json({ error: "حالة غير صحيحة" }, { status: 400 });
  }

  const currentApplication = await prisma.application.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });

  if (!currentApplication) {
    return NextResponse.json({ error: "التقديم غير موجود" }, { status: 404 });
  }

  if (body.status === "ACCEPTED") {
    try {
      await giveAcceptedRole(currentApplication.user.discordId);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "فشل إعطاء الرتبة" },
        { status: 400 }
      );
    }
  }

  const application = await prisma.application.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({ success: true, application });
}

export async function DELETE(_req: Request, context: RouteContext) {
  const admin = await requireAdmin();

  if (!admin.authorized) {
    return admin.response;
  }

  const { id } = await context.params;

  await prisma.application.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

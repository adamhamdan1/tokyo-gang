import { auth } from "@/auth";
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

export async function PATCH(req: Request, context: RouteContext) {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return NextResponse.json(
      {
        error: "Access Denied",
        currentDiscordId: session?.user?.id ?? null,
      },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const body = (await req.json()) as UpdateBody;

  if (!body.status || !["ACCEPTED", "REJECTED", "PENDING"].includes(body.status)) {
    return NextResponse.json({ error: "حالة غير صحيحة" }, { status: 400 });
  }

  const application = await prisma.application.update({
    where: { id },
    data: { status: body.status },
  });

  return NextResponse.json({ success: true, application });
}

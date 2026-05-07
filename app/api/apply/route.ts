import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "يجب تسجيل الدخول بالديسكورد أولاً" },
      { status: 401 }
    );
  }

  const body = await req.json();

  const user = await prisma.user.findUnique({
    where: {
      discordId: session.user.id,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "الحساب غير موجود" },
      { status: 404 }
    );
  }

  const application = await prisma.application.create({
    data: {
      name: body.name,
      age: body.age,
      experience: body.experience,
      reason: body.reason,
      userId: user.id,
    },
  });

  return NextResponse.json({ success: true, application });
}
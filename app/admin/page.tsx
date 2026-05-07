import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",") || [];

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    redirect("/");
  }

  const applications = await prisma.application.findMany({
    include: {
      user: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <main dir="rtl" className="min-h-screen bg-black text-white p-8">
      <h1 className="text-5xl font-black mb-10">لوحة إدارة التقديمات</h1>

      <div className="grid gap-6">
        {applications.map((app: any) => (
          <div
            key={app.id}
            className="bg-zinc-950 border border-white/20 rounded-3xl p-6"
          >
            <div className="flex items-center gap-4 mb-5">
              {app.user.image && (
                <img
                  src={app.user.image}
                  className="w-14 h-14 rounded-full"
                  alt={app.user.username}
                />
              )}

              <div>
                <h2 className="text-2xl font-black">{app.name}</h2>
                <p className="text-gray-400">
                  Discord: {app.user.username}
                </p>
                <p className="text-gray-500 text-sm">
                  ID: {app.user.discordId}
                </p>
              </div>
            </div>

            <p>العمر: {app.age}</p>
            <p className="mt-3">الخبرة: {app.experience}</p>
            <p className="mt-3">سبب الانضمام: {app.reason}</p>

            <p className="mt-5 text-yellow-400 font-bold">
              الحالة: {app.status}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
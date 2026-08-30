import { getAdminContext } from "@/lib/admin-permissions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminOperationsCenter } from "../AdminOperationsCenter";
import { ensureCommandSchema } from "@/lib/command-schema";

export default async function AdminOperationsPage() {
  const admin = await getAdminContext();
  if (!admin || (!admin.capabilities.ALL && !admin.capabilities.OPERATIONS)) {
    return (
      <main dir="rtl" className="flex min-h-screen items-center justify-center bg-black p-6 text-white">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-10 text-center">
          <p className="text-xs font-black tracking-[5px] text-red-300">OPERATIONS ACCESS</p>
          <h1 className="mt-4 text-4xl font-black">ممنوع الدخول</h1>
          <Link href="/admin" className="mt-6 inline-flex rounded-2xl bg-white px-6 py-3 font-black text-black">الرجوع للإدارة</Link>
        </div>
      </main>
    );
  }

  await ensureCommandSchema();

  const [members, operations] = await Promise.all([
    prisma.tokyoMember.findMany({
      where: { inTokyoRole: true },
      orderBy: { displayName: "asc" },
      select: { id: true, displayName: true, username: true, image: true, internalRank: true },
    }),
    prisma.operation.findMany({
      orderBy: [{ status: "asc" }, { startsAt: "desc" }],
      take: 80,
      include: {
        commander: { select: { id: true, displayName: true, image: true } },
        participants: {
          orderBy: { createdAt: "asc" },
          include: { member: { select: { id: true, displayName: true, username: true, image: true } } },
        },
      },
    }),
  ]);

  return (
    <main dir="rtl" className="tokyo-dashboard relative min-h-screen overflow-hidden px-3 py-5 text-white sm:px-5 md:p-10">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[length:100%_6px,80px_80px] opacity-50" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-5 flex flex-wrap gap-3">
          <Link href="/admin" className="rounded-2xl border border-white/15 bg-black/60 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-white/30 hover:text-white">الرجوع للوحة الإدارة</Link>
          <span className="rounded-2xl border border-green-400/20 bg-green-400/10 px-5 py-3 text-sm font-black text-green-300">OPERATOR: {admin.name}</span>
        </div>
        <AdminOperationsCenter
          members={members}
          operations={operations.map((operation) => ({
            ...operation,
            startsAt: operation.startsAt.toISOString(),
            createdAt: operation.createdAt.toISOString(),
            updatedAt: operation.updatedAt.toISOString(),
            participants: operation.participants.map((participant) => ({
              ...participant,
              checkedInAt: participant.checkedInAt?.toISOString() ?? null,
              createdAt: participant.createdAt.toISOString(),
            })),
          }))}
        />
      </div>
    </main>
  );
}

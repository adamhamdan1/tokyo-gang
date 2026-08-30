import { getAdminContext } from "@/lib/admin-permissions";
import { ensureCommandSchema } from "@/lib/command-schema";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminProgressionCenter } from "../AdminProgressionCenter";

export default async function ProgressionPage() {
  const admin = await getAdminContext();
  if (!admin || (!admin.capabilities.ALL && !admin.capabilities.MEMBERS)) return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-black text-white"><div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-10 text-center"><h1 className="text-4xl font-black">ممنوع الدخول</h1><Link href="/admin" className="mt-5 inline-block rounded-2xl bg-white px-6 py-3 font-black text-black">رجوع</Link></div></main>;
  await ensureCommandSchema();
  const [members, tasks, season, achievements] = await Promise.all([
    prisma.tokyoMember.findMany({ where: { inTokyoRole: true }, orderBy: [{ commandPoints: "desc" }, { displayName: "asc" }], select: { id: true, displayName: true, username: true, internalRank: true, commandPoints: true, activityScore: true } }),
    prisma.memberTask.findMany({ orderBy: { createdAt: "desc" }, take: 60, include: { assignments: { include: { member: { select: { id: true, displayName: true, username: true } } }, orderBy: { createdAt: "asc" } } } }),
    prisma.tokyoSeason.findFirst({ where: { active: true }, orderBy: { createdAt: "desc" } }),
    prisma.achievement.findMany({ where: { active: true }, orderBy: { points: "asc" }, include: { _count: { select: { members: true } } } }),
  ]);
  return <main dir="rtl" className="tokyo-dashboard min-h-screen px-3 py-5 text-white sm:px-5 md:p-10"><div className="mx-auto max-w-7xl"><Link href="/admin" className="mb-5 inline-flex rounded-2xl border border-white/15 bg-black/60 px-5 py-3 text-sm font-black text-zinc-300">الرجوع للإدارة</Link><AdminProgressionCenter members={members} tasks={tasks.map((task) => ({ ...task, dueAt: task.dueAt?.toISOString() ?? null, createdAt: task.createdAt.toISOString(), updatedAt: task.updatedAt.toISOString(), assignments: task.assignments.map((item) => ({ ...item, completedAt: item.completedAt?.toISOString() ?? null, createdAt: item.createdAt.toISOString() })) }))} season={season ? { name: season.name, startsAt: season.startsAt.toISOString(), endsAt: season.endsAt.toISOString() } : null} achievements={achievements} /></div></main>;
}

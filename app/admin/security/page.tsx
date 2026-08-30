import { getAdminContext } from "@/lib/admin-permissions";
import { ensureCommandSchema } from "@/lib/command-schema";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { AdminDiagnosticsButton } from "../AdminDiagnosticsButton";

export default async function SecurityPage() {
  const admin = await getAdminContext();
  if (!admin || (!admin.capabilities.ALL && !admin.capabilities.LOGS)) return <main dir="rtl" className="flex min-h-screen items-center justify-center bg-black text-white"><h1 className="text-4xl font-black">ممنوع الدخول</h1></main>;
  await ensureCommandSchema();
  // eslint-disable-next-line react-hooks/purity
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [logs, blacklisted, severeWarnings, roleChanges, restricted, recentOperations] = await Promise.all([
    prisma.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.blacklistEntry.count({ where: { active: true } }),
    prisma.memberWarning.count({ where: { severity: { in: ["HIGH", "FINAL", "DISMISSAL"] }, createdAt: { gte: since } } }),
    prisma.roleAudit.findMany({ where: { createdAt: { gte: since } }, orderBy: { createdAt: "desc" }, take: 30, include: { member: { select: { displayName: true } } } }),
    prisma.tokyoMember.count({ where: { securityClearance: "RESTRICTED" } }),
    prisma.operation.count({ where: { createdAt: { gte: since } } }),
  ]);
  const criticalActions = logs.filter((log) => ["BLACKLIST_ADD", "MEMBER_SUMMON", "DISCORD_ROLE_REMOVE", "APPLICATION_DELETE", "OPERATION_DELETE"].includes(log.action));
  const securityScore = Math.max(0, 100 - blacklisted * 6 - severeWarnings * 4 - restricted * 3 - criticalActions.length * 2);
  const level = securityScore >= 85 ? "STABLE" : securityScore >= 65 ? "WATCH" : "ALERT";
  return <main dir="rtl" className="tokyo-dashboard min-h-screen px-3 py-5 text-white sm:px-5 md:p-10"><div className="mx-auto max-w-7xl"><Link href="/admin" className="mb-5 inline-flex rounded-2xl border border-white/15 bg-black/60 px-5 py-3 text-sm font-black text-zinc-300">الرجوع للإدارة</Link><header className="tokyo-glass rounded-[34px] p-6 md:p-9"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-black tracking-[5px] text-red-400">TOKYO SECURITY CENTER</p><h1 className="tokyo-section-title mt-3 text-4xl font-black md:text-6xl">غرفة الأمن والمراقبة</h1><p className="mt-4 max-w-3xl leading-8 text-zinc-400">تدقيق القرارات الحساسة، سلامة الربط، الرتب والحالات التي تحتاج مراقبة.</p></div><div className={`rounded-3xl border p-5 text-center ${level === "STABLE" ? "border-green-400/30 bg-green-400/10 text-green-300" : level === "WATCH" ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-300" : "border-red-400/30 bg-red-400/10 text-red-300"}`}><p className="text-xs font-black tracking-[3px]">SECURITY {level}</p><p className="mt-2 text-5xl font-black">{securityScore}</p></div></div><div className="mt-7 grid gap-3 md:grid-cols-5">{[["Blacklist",blacklisted],["تحذيرات قوية",severeWarnings],["تصريح مقيّد",restricted],["تغييرات رتب",roleChanges.length],["عمليات أسبوعية",recentOperations]].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-black/40 p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}</div></header><section className="my-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="grid content-start gap-5"><div className="tokyo-panel p-5"><p className="text-xs font-black tracking-[4px] text-cyan-300">SYSTEM DIAGNOSTICS</p><p className="my-4 text-sm leading-7 text-zinc-400">افحص البوت، Discord، قاعدة البيانات، رتب التحذير وOnline Widget مباشرة.</p><AdminDiagnosticsButton /></div><div className="tokyo-panel p-5"><p className="text-xs font-black tracking-[4px] text-red-300">CRITICAL WATCHLIST</p><div className="mt-4 grid gap-2">{criticalActions.length===0&&<p className="text-zinc-600">لا توجد أحداث حساسة حديثة.</p>}{criticalActions.slice(0,15).map((log)=><div key={log.id} className="rounded-2xl border border-red-400/15 bg-red-400/[0.04] p-3"><strong className="text-sm">{log.title}</strong><p className="mt-1 text-xs text-zinc-600">{log.action} — {log.createdAt.toLocaleString("ar")}</p></div>)}</div></div></div><div className="tokyo-panel p-5 md:p-6"><p className="text-xs font-black tracking-[4px] text-yellow-300">ROLE & ADMIN AUDIT</p><div className="mt-4 grid gap-2">{roleChanges.map((change)=><div key={change.id} className="grid gap-2 rounded-2xl border border-white/10 bg-black/40 p-4 sm:grid-cols-[1fr_auto]"><div><strong>{change.member.displayName}</strong><p className="mt-1 text-sm text-zinc-400">{change.action}: {change.rank}</p></div><span className="text-xs text-zinc-600">{change.createdAt.toLocaleString("ar")}</span></div>)}</div></div></section></div></main>;
}

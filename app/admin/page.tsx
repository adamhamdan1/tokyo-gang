import { prisma } from "@/lib/prisma";
import { getAdminContext } from "@/lib/admin-permissions";
import { getDatabaseAdminIds } from "@/lib/admin-permissions";
import { calculateApplicationQuality } from "@/lib/application-insights";
import { calculateMemberRisk } from "@/lib/member-insights";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
import { syncWarningsSafely } from "@/lib/warning-sync";
import { AdminDecisionButtons } from "./AdminDecisionButtons";
import { AdminAlertForm } from "./AdminAlertForm";
import { AdminAnnouncementDeleteButton } from "./AdminAnnouncementDeleteButton";
import { AdminAnnouncementForm } from "./AdminAnnouncementForm";
import { AdminComplaintActions } from "./AdminComplaintActions";
import { AdminComplaintVote } from "./AdminComplaintVote";
import { AdminDiscordTestButton } from "./AdminDiscordTestButton";
import { AdminLogDeleteButton } from "./AdminLogDeleteButton";
import { AdminLeaveDecisionButtons } from "./AdminLeaveDecisionButtons";
import { AdminWarningAutoRefresh } from "./AdminWarningAutoRefresh";
import { AdminSignOutButton } from "./AdminSignOutButton";
import { AdminSpotlightForm } from "./AdminSpotlightForm";
import { AdminManagerForm } from "./AdminManagerForm";
import { AdminWeeklyReportButton } from "./AdminWeeklyReportButton";
import { AdminDiagnosticsButton } from "./AdminDiagnosticsButton";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminSyncButton } from "./AdminSyncButton";
import { AdminSummonDeleteButton } from "./AdminSummonDeleteButton";
import { AdminSummonForm } from "./AdminSummonForm";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  PENDING: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.12)]",
  ACCEPTED: "border-green-400/40 bg-green-400/10 text-green-300 shadow-[0_0_24px_rgba(74,222,128,0.12)]",
  REJECTED: "border-red-500/40 bg-red-500/10 text-red-300 shadow-[0_0_24px_rgba(239,68,68,0.14)]",
  INTERVIEW: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.12)]",
  TRIAL: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]",
};

const filterTabs = [
  ["الكل", "ALL"],
  ["الأولوية", "PRIORITY"],
  ["قيد المراجعة", "PENDING"],
  ["المقبولين", "ACCEPTED"],
  ["المرفوضين", "REJECTED"],
  ["المقابلات", "INTERVIEW"],
  ["فترة التجربة", "TRIAL"],
];

function buildAdminHref(status: string, query: string, logs?: string) {
  const params = new URLSearchParams();

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (query) {
    params.set("q", query);
  }

  if (logs) {
    params.set("logs", logs);
  }

  const value = params.toString();
  return value ? `/admin?${value}` : "/admin";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; q?: string; logs?: string; members?: string; mode?: string }>;
}) {
  const admin = await getAdminContext();
  const params = await searchParams;
  const activeStatus = ["PRIORITY", "PENDING", "ACCEPTED", "REJECTED", "INTERVIEW", "TRIAL"].includes(params?.status ?? "")
    ? params?.status
    : "ALL";
  const query = params?.q?.trim() ?? "";
  const showAllLogs = params?.logs === "all";
  const mode = ["APPLICATIONS", "DISCIPLINE", "MEMBERS", "SYSTEM"].includes(params?.mode ?? "") ? params?.mode : "APPLICATIONS";
  const memberFilter = ["WARNED", "HIGH_RISK", "LEAVE", "SUMMONED", "RISK"].includes(params?.members ?? "")
    ? params?.members
    : "ALL";
  // eslint-disable-next-line react-hooks/purity
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // eslint-disable-next-line react-hooks/purity
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  if (!admin) {
    return (
      <main dir="rtl" className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-8 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:100%_6px] opacity-70" />
        <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-red-500/10 px-10 py-8 text-center shadow-[0_0_55px_rgba(239,68,68,0.20)]">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent" />
          <p className="text-sm font-black tracking-[6px] text-red-400">SECURITY TERMINAL</p>
          <h1 className="mt-4 text-5xl font-black">ACCESS DENIED</h1>
          <div className="mx-auto mt-6 h-1 w-56 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 bg-red-500 shadow-[0_0_18px_rgba(239,68,68,0.7)]" />
          </div>
          <p className="mt-5 text-sm text-gray-300">
            Discord ID الحالي: غير مصرح
          </p>
        </div>
      </main>
    );
  }

  const tokyoSync = await syncTokyoMembersSafely();
  await syncWarningsSafely();

  const [
    applications,
    totalApplications,
    acceptedApplications,
    rejectedApplications,
    trialApplications,
    newPendingApplications,
    announcements,
    tokyoMembers,
    activeSummons,
    complaints,
    recentLogs,
    adminLogCount,
    warningCount,
    leaveCount,
    blacklistCount,
    pendingLeaves,
    extraAdmins,
    weeklyApplications,
    weeklyAccepted,
    weeklyWarnings,
    weeklySummons,
    weeklyComplaints,
    adminActivity,
  ] = await Promise.all([
    prisma.application.findMany({
      where: {
        ...(activeStatus === "ALL" || activeStatus === "PRIORITY" ? {} : { status: activeStatus }),
        ...(activeStatus === "PRIORITY"
          ? {
              status: "PENDING",
              hasMic: true,
            }
          : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { age: { contains: query, mode: "insensitive" as const } },
                { experience: { contains: query, mode: "insensitive" as const } },
                { reason: { contains: query, mode: "insensitive" as const } },
                { user: { username: { contains: query, mode: "insensitive" as const } } },
                { user: { discordId: { contains: query, mode: "insensitive" as const } } },
              ],
            }
          : {}),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.application.count(),
    prisma.application.count({ where: { status: "ACCEPTED" } }),
    prisma.application.count({ where: { status: "REJECTED" } }),
    prisma.application.count({ where: { status: "TRIAL" } }),
    prisma.application.count({ where: { status: "PENDING", createdAt: { gte: dayAgo } } }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.tokyoMember.findMany({
      where: { inTokyoRole: true },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        username: true,
        discordId: true,
        status: true,
        behaviorScore: true,
        summons: {
          where: { status: "ACTIVE" },
          select: { id: true },
        },
        complaintsAgainst: {
          where: {
            status: {
              notIn: ["RESOLVED", "DISMISSED"],
            },
          },
          select: { id: true },
        },
        blacklistEntries: {
          where: { active: true },
          select: { id: true },
        },
        warnings: {
          select: { id: true, severity: true },
        },
      },
    }),
    prisma.summon.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        member: true,
      },
    }),
    prisma.complaint.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: {
        reporter: true,
        accused: true,
        votes: true,
      },
    }),
    prisma.adminLog.findMany({
      orderBy: { createdAt: "desc" },
      ...(showAllLogs ? {} : { take: 3 }),
    }),
    prisma.adminLog.count(),
    prisma.memberWarning.count(),
    prisma.leaveRequest.count({ where: { status: "APPROVED" } }),
    prisma.blacklistEntry.count({ where: { active: true } }),
    prisma.leaveRequest.findMany({
      where: { status: "PENDING" },
      include: { member: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    getDatabaseAdminIds(),
    prisma.application.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.application.count({ where: { status: "ACCEPTED", decidedAt: { gte: weekAgo } } }),
    prisma.memberWarning.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.summon.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.complaint.count({ where: { createdAt: { gte: weekAgo } } }),
    prisma.adminLog.groupBy({
      by: ["adminDiscordId"],
      where: {
        createdAt: { gte: weekAgo },
        adminDiscordId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { adminDiscordId: "desc" } },
      take: 6,
    }),
  ]);

  const stats = [
    ["عدد التقديمات", totalApplications],
    ["عدد المقبولين", acceptedApplications],
    ["فترة التجربة", trialApplications],
    ["أعضاء TOKYO", tokyoMembers.length],
    ["التحذيرات", warningCount],
    ["الإجازات", leaveCount],
    ["البلاك ليست", blacklistCount],
    ["عدد المرفوضين", rejectedApplications],
  ];
  const filteredTokyoMembers = tokyoMembers.filter((member) => {
    const risk = calculateMemberRisk(member);
    const matchesQuery =
      !query ||
      member.displayName.toLowerCase().includes(query.toLowerCase()) ||
      member.username.toLowerCase().includes(query.toLowerCase()) ||
      member.discordId.includes(query) ||
      member.status.toLowerCase().includes(query.toLowerCase()) ||
      member.warnings.some((warning) => warning.severity.toLowerCase().includes(query.toLowerCase()));

    if (!matchesQuery) return false;
    if (memberFilter === "WARNED") return member.warnings.length > 0;
    if (memberFilter === "HIGH_RISK") return member.warnings.some((warning) => warning.severity === "HIGH" || warning.severity === "DISMISSAL");
    if (memberFilter === "LEAVE") return member.status === "ON_LEAVE";
    if (memberFilter === "SUMMONED") return member.summons.length > 0 || member.status === "SUMMONED";
    if (memberFilter === "RISK") return risk.level === "HIGH" || risk.level === "CRITICAL";

    return true;
  });
  const healthItems = [
    ["Bot", process.env.DISCORD_BOT_TOKEN ? "LINKED" : "MISSING"],
    ["DB", "CONNECTED"],
    ["Members Sync", tokyoSync ? `${tokyoSync.count} عضو` : "READY"],
    ["Warnings Sync", "30s"],
  ];
  const highRiskMemberCount = tokyoMembers.filter((member) => {
    const risk = calculateMemberRisk(member);
    return risk.level === "HIGH" || risk.level === "CRITICAL";
  }).length;
  const quickReviewItems = [
    ["تقديمات للمراجعة", applications.filter((application) => application.status === "PENDING").length],
    ["تحذيرات قرب الانتهاء", warningCount],
    ["أعضاء Risk عالي", highRiskMemberCount],
    ["شكاوي مفتوحة", complaints.filter((item) => item.status !== "RESOLVED" && item.status !== "DISMISSED").length],
    ["إجازات معلقة", pendingLeaves.length],
  ];

  return (
    <main dir="rtl" className="relative min-h-screen overflow-hidden bg-black px-3 py-5 text-white sm:px-5 md:p-10">
      <AdminWarningAutoRefresh />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:100%_6px,80px_80px] opacity-55" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(239,68,68,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.10),transparent_26%),radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.72)_100%)]" />
      <Link
        href="/"
        className="fixed left-3 top-3 z-50 rounded-xl border border-white/20 bg-white px-4 py-2 text-xs font-black text-black shadow-[0_0_28px_rgba(255,255,255,0.2)] transition hover:bg-gray-300 md:left-5 md:top-5 md:rounded-2xl md:px-5 md:py-3 md:text-sm"
      >
        الرئيسية
      </Link>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_0_50px_rgba(255,255,255,0.05)] backdrop-blur-xl md:mb-10 md:rounded-3xl md:p-8">
          <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-4 text-[10px] font-black tracking-[3px] text-gray-500 sm:flex-row sm:items-center sm:justify-between md:mb-6 md:text-xs md:tracking-[4px]">
            <span>TOKYO COMMAND CENTER</span>
            <span className="flex items-center gap-2 text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_lime]" />
              SYSTEM ARMED
            </span>
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black tracking-[5px] text-red-500 md:text-sm md:tracking-[6px]">TOKYO ADMIN</p>
            <h1 className="mt-3 text-3xl font-black leading-tight drop-shadow-[0_0_28px_rgba(255,255,255,0.35)] sm:text-4xl md:text-5xl">
              لوحة إدارة التقديمات
            </h1>
          </div>

          <div className="w-fit rounded-2xl border border-white/15 bg-zinc-950 px-4 py-2 text-sm text-gray-300 md:px-5 md:py-3">
            {admin.name}
          </div>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:mb-8 lg:flex lg:flex-wrap">
          <Link
            href="/"
            className="rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 text-center text-sm font-black text-gray-300 transition hover:border-white/30 hover:text-white"
          >
            الرجوع للرئيسية
          </Link>
          <AdminDiscordTestButton />
          <AdminDiagnosticsButton />
          <AdminSyncButton />
          <AdminSignOutButton />
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-center text-sm font-black text-cyan-300">
            مزامنة TOKYO تلقائية{tokyoSync ? `: ${tokyoSync.count} عضو` : ""}
          </div>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-3 md:mb-10 md:gap-4 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div
              key={label}
              className="group relative overflow-hidden rounded-2xl border border-white/15 bg-zinc-950/85 p-4 shadow-[0_0_40px_rgba(255,255,255,0.06)] md:rounded-3xl md:p-6"
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-60" />
              <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.08),transparent)]" />
              <p className="relative z-10 text-xs text-gray-400 md:text-sm">{label}</p>
              <p className="relative z-10 mt-3 text-3xl font-black text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.35)] md:text-5xl">
                {value}
              </p>
            </div>
          ))}
        </section>

        <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-5 md:mb-10 md:rounded-3xl md:p-6">
          <p className="text-xs font-black tracking-[5px] text-white">QUICK REVIEW</p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            {quickReviewItems.map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:mb-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-cyan-400/20 bg-zinc-950 p-5 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-cyan-300">SYSTEM HEALTH</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {healthItems.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`mt-2 font-black ${value === "MISSING" ? "text-red-300" : "text-green-300"}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-white">ADMIN PERMISSIONS</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {Object.entries(admin.capabilities)
                .filter(([, enabled]) => enabled)
                .map(([capability]) => (
                  <span key={capability} className="rounded-full border border-green-400/25 bg-green-400/10 px-4 py-2 text-xs font-black text-green-300">
                    {capability}
                  </span>
                ))}
            </div>
          </div>
        </section>

        <AdminAnnouncementForm />
        <AdminAlertForm />
        {admin.isOwner && <AdminManagerForm admins={extraAdmins} />}
        <AdminSpotlightForm members={tokyoMembers} />

        <AdminSummonForm members={tokyoMembers} />

        <section className="mb-8 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-zinc-950/85 p-3 md:mb-10 md:rounded-3xl">
          {[
            ["Applications Mode", "APPLICATIONS"],
            ["Discipline Mode", "DISCIPLINE"],
            ["Members Mode", "MEMBERS"],
            ["System Mode", "SYSTEM"],
          ].map(([label, value]) => (
            <Link
              key={value}
              href={`/admin?mode=${value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              className={`rounded-2xl border px-4 py-3 text-xs font-black transition ${
                mode === value ? "border-white bg-white text-black" : "border-white/15 text-gray-300 hover:text-white"
              }`}
            >
              {label}
            </Link>
          ))}
        </section>

        {(mode === "DISCIPLINE" || mode === "MEMBERS" || mode === "SYSTEM") && pendingLeaves.length > 0 && (
          <section className="mb-8 rounded-2xl border border-emerald-400/20 bg-zinc-950 p-5 md:mb-10 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-emerald-300">PENDING LEAVES</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {pendingLeaves.map((leave) => (
                <article key={leave.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={`/admin/members/${leave.member.id}`} className="font-black text-white hover:text-emerald-300">
                      {leave.member.displayName}
                    </Link>
                    <span className="rounded-full border border-emerald-400/25 px-3 py-1 text-xs font-black text-emerald-300">
                      قيد المراجعة
                    </span>
                  </div>
                  <p className="mt-3 leading-7 text-gray-300">{leave.reason}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    {leave.startsAt ? `تبدأ: ${leave.startsAt.toLocaleString("ar")}` : "تبدأ فوراً"}
                    {leave.endsAt ? ` - تنتهي: ${leave.endsAt.toLocaleString("ar")}` : ""}
                  </p>
                  <AdminLeaveDecisionButtons leaveId={leave.id} />
                </article>
              ))}
            </div>
          </section>
        )}

        {(mode === "DISCIPLINE" || mode === "SYSTEM") && <section className="mb-8 grid gap-4 lg:mb-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-green-400/20 bg-green-400/10 p-5 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-green-300">ADMIN NOTIFICATIONS</p>
            <div className="mt-5 grid gap-3 text-sm">
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4">
                تقديمات جديدة آخر 24 ساعة: <span className="font-black text-white">{newPendingApplications}</span>
              </p>
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4">
                شكاوي مفتوحة: <span className="font-black text-white">{complaints.filter((item) => item.status !== "RESOLVED" && item.status !== "DISMISSED").length}</span>
              </p>
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4">
                أعضاء تحت الاستدعاء: <span className="font-black text-white">{activeSummons.filter((item) => item.status === "ACTIVE").length}</span>
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-zinc-950 p-5 md:rounded-3xl md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-[5px] text-cyan-300">ADMIN LOG</p>
                <p className="mt-1 text-xs text-gray-500">
                  {showAllLogs ? `كل اللوغات: ${adminLogCount}` : "آخر 3 أحداث"}
                </p>
              </div>
              {adminLogCount > 3 && (
                <Link
                  href={buildAdminHref(activeStatus ?? "ALL", query, showAllLogs ? undefined : "all")}
                  className="rounded-xl border border-cyan-400/25 px-4 py-2 text-xs font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-black"
                >
                  {showAllLogs ? "عرض آخر 3" : "عرض الكل"}
                </Link>
              )}
            </div>
            <div className="mt-5 grid gap-3">
              {recentLogs.map((log) => (
                <article key={log.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-black text-white">{log.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-600">{log.createdAt.toLocaleString("ar")}</span>
                      <AdminLogDeleteButton logId={log.id} />
                    </div>
                  </div>
                  <p className="mt-1 text-xs font-black tracking-[2px] text-cyan-300">{log.action}</p>
                </article>
              ))}
            </div>
          </div>
        </section>}

        {mode === "SYSTEM" && (
          <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-5 md:mb-10 md:rounded-3xl md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black tracking-[5px] text-white">WEEKLY REPORT</p>
                <p className="mt-1 text-xs text-gray-500">آخر 7 أيام من نشاط الإدارة والنظام.</p>
              </div>
              <AdminWeeklyReportButton />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              {[
                ["تقديمات", weeklyApplications],
                ["قبول", weeklyAccepted],
                ["تحذيرات", weeklyWarnings],
                ["استدعاءات", weeklySummons],
                ["شكاوي", weeklyComplaints],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-2 text-3xl font-black text-white">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="text-xs font-black tracking-[4px] text-cyan-300">ADMIN ACTIVITY SCORE</p>
              <div className="mt-4 grid gap-2 md:grid-cols-3">
                {adminActivity.map((item) => (
                  <div key={item.adminDiscordId ?? "unknown"} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="break-all text-xs text-gray-500">{item.adminDiscordId}</p>
                    <p className="mt-1 text-xl font-black text-white">{item._count._all}</p>
                  </div>
                ))}
                {adminActivity.length === 0 && <p className="text-sm text-gray-500">لا يوجد نشاط إداري هذا الأسبوع.</p>}
              </div>
            </div>
          </section>
        )}

        {(mode === "MEMBERS" || mode === "DISCIPLINE" || mode === "SYSTEM") && <section className="mb-8 rounded-2xl border border-white/10 bg-zinc-950 p-5 md:mb-10 md:rounded-3xl md:p-6">
          <p className="text-xs font-black tracking-[5px] text-red-400">TOKYO MEMBER DIRECTORY</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ["الكل", "ALL"],
              ["عنده تحذير", "WARNED"],
              ["خطر", "HIGH_RISK"],
              ["إجازة", "LEAVE"],
              ["استدعاء", "SUMMONED"],
              ["Risk عالي", "RISK"],
            ].map(([label, value]) => (
              <Link
                key={value}
                href={`/admin?members=${value}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
                className={`rounded-xl border px-4 py-2 text-xs font-black ${
                  memberFilter === value ? "border-white bg-white text-black" : "border-white/15 text-gray-300 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredTokyoMembers.length === 0 && (
              <div className="md:col-span-2 lg:col-span-3">
                <AdminEmptyState title="لا يوجد أعضاء مطابقين" message="الفلاتر الحالية لا تحتوي نتائج. غيّر الفلتر أو البحث." />
              </div>
            )}
            {filteredTokyoMembers.map((member) => {
              const risk = calculateMemberRisk(member);

              return (
              <Link
                key={member.id}
                href={`/admin/members/${member.id}`}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-white">{member.displayName}</p>
                    <p className="mt-1 text-xs text-gray-500">@{member.username}</p>
                  </div>
                  <div className="text-left">
                    <AdminStatusBadge value={member.status} compact />
                    {member.warnings.length > 0 && (
                      <p className="mt-1 text-xs text-yellow-300">{member.warnings.length} تحذير</p>
                    )}
                    <p className={`mt-1 text-xs font-black ${risk.level === "CRITICAL" ? "text-red-400" : risk.level === "HIGH" ? "text-orange-300" : "text-gray-500"}`}>
                      RISK {risk.score}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-xl border border-white/10 px-3 py-2 text-xs text-gray-400">فتح الملف</span>
                  <span className="rounded-xl border border-yellow-400/20 px-3 py-2 text-xs font-black text-yellow-300">تحذير</span>
                  <span className="rounded-xl border border-cyan-400/20 px-3 py-2 text-xs font-black text-cyan-300">استدعاء</span>
                </div>
              </Link>
              );
            })}
          </div>
        </section>}

        {(mode === "DISCIPLINE" || mode === "SYSTEM") && complaints.length > 0 && (
          <section className="mb-8 rounded-2xl border border-red-500/20 bg-zinc-950 p-4 md:mb-10 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-red-400">MEMBER COMPLAINTS</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {complaints.map((complaint) => (
                <article key={complaint.id} className="rounded-2xl border border-white/10 bg-black/40 p-4 md:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">المشتكي</p>
                      <Link href={`/admin/members/${complaint.reporter.id}`} className="font-black text-white hover:text-cyan-300">
                        {complaint.reporter.displayName}
                      </Link>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">المشكو عليه</p>
                      <Link href={`/admin/members/${complaint.accused.id}`} className="font-black text-white hover:text-cyan-300">
                        {complaint.accused.displayName}
                      </Link>
                    </div>
                    <span className="rounded-full border border-red-400/30 px-3 py-1 text-xs font-black text-red-300">
                      {complaint.status}
                    </span>
                  </div>
                  <p className="mt-4 text-xs font-black tracking-[3px] text-red-300">{complaint.category}</p>
                  <p className="mt-2 leading-7 text-gray-300">{complaint.reason}</p>
                  {complaint.details && <p className="mt-2 text-sm text-gray-500">{complaint.details}</p>}
                  {complaint.evidenceUrl && (
                    <a href={complaint.evidenceUrl} target="_blank" className="mt-3 inline-block text-sm font-black text-cyan-300">
                      فتح الدليل
                    </a>
                  )}
                  {complaint.adminNote && <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-gray-400">{complaint.adminNote}</p>}
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-green-400/20 px-3 py-1 text-green-300">
                      مع: {complaint.votes.filter((vote) => vote.vote === "FOR").length}
                    </span>
                    <span className="rounded-full border border-red-500/20 px-3 py-1 text-red-300">
                      ضد: {complaint.votes.filter((vote) => vote.vote === "AGAINST").length}
                    </span>
                    <span className="rounded-full border border-white/15 px-3 py-1 text-gray-300">
                      محايد: {complaint.votes.filter((vote) => vote.vote === "ABSTAIN").length}
                    </span>
                  </div>
                  <AdminComplaintVote complaintId={complaint.id} />
                  <AdminComplaintActions complaintId={complaint.id} status={complaint.status} />
                </article>
              ))}
            </div>
          </section>
        )}

        {(mode === "DISCIPLINE" || mode === "SYSTEM") && activeSummons.length > 0 && (
          <section className="mb-8 rounded-2xl border border-cyan-400/20 bg-zinc-950 p-5 md:mb-10 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-cyan-300">RECENT SUMMONS</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {activeSummons.map((summon) => (
                <article key={summon.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Link href={`/admin/members/${summon.member.id}`} className="font-black text-white hover:text-cyan-300">
                      {summon.member.displayName}
                    </Link>
                    <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-black text-cyan-300">
                      {summon.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">{summon.reason}</p>
                  {summon.details && <p className="mt-2 text-xs text-gray-500">{summon.details}</p>}
                  <AdminSummonDeleteButton summonId={summon.id} />
                </article>
              ))}
            </div>
          </section>
        )}

        {(mode === "SYSTEM" || mode === "APPLICATIONS") && announcements.length > 0 && (
          <section className="mb-8 grid gap-4 md:mb-10 md:grid-cols-2">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-2xl border border-white/15 bg-zinc-950 p-5 md:rounded-3xl md:p-6">
                <p className="text-xs font-black tracking-[4px] text-red-500">TOKYO NOTICE</p>
                <h3 className="mt-3 text-2xl font-black">{announcement.title}</h3>
                <p className="mt-3 leading-8 text-gray-400">{announcement.message}</p>
                <AdminAnnouncementDeleteButton id={announcement.id} />
              </article>
            ))}
          </section>
        )}

        {mode === "APPLICATIONS" && <section className="sticky top-2 z-40 mb-8 rounded-2xl border border-white/10 bg-black/85 p-3 backdrop-blur-xl md:top-0 md:rounded-3xl md:p-4">
          <form className="mb-4 flex flex-col gap-3 md:flex-row" action="/admin">
            {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
            <input
              name="q"
              defaultValue={query}
              placeholder="ابحث بالاسم أو Discord ID..."
              className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 outline-none"
            />
            <button className="rounded-2xl bg-white px-6 py-3 font-black text-black transition hover:bg-gray-300">
              بحث
            </button>
            {query && (
              <Link href={buildAdminHref(activeStatus ?? "ALL", "")} className="rounded-2xl border border-white/15 px-6 py-3 text-center font-black text-gray-300">
                مسح
              </Link>
            )}
          </form>
          <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
          {filterTabs.map(([label, status]) => {
            const href = buildAdminHref(status, query);
            const active = activeStatus === status;

            return (
              <Link
                key={status}
                href={href}
                className={`shrink-0 rounded-2xl border px-4 py-3 text-xs font-black transition md:px-5 md:text-sm ${
                  active
                    ? "border-white bg-white text-black"
                    : "border-white/15 bg-zinc-950 text-gray-300 hover:border-white/30 hover:text-white"
                }`}
              >
                {label}
                {status === "PENDING" && newPendingApplications > 0 && (
                  <span className="ms-2 rounded-full bg-red-500 px-2 py-0.5 text-xs text-white">
                    جديد {newPendingApplications}
                  </span>
                )}
              </Link>
            );
          })}
          </div>
        </section>}

        {mode === "APPLICATIONS" && <section className="grid gap-5 md:gap-6">
          {applications.length === 0 && <AdminEmptyState title="لا توجد تقديمات" message="لا توجد طلبات مطابقة للفلاتر الحالية." />}
          {applications.map((app) => {
            const style = statusStyles[app.status] ?? statusStyles.PENDING;
            const quality = calculateApplicationQuality(app);
            const submittedAt = new Intl.DateTimeFormat("ar", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(app.createdAt);

            return (
              <article
                key={app.id}
                className={`rounded-2xl border p-4 md:rounded-3xl md:p-6 ${style}`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3 md:gap-4">
                    {app.user.image ? (
                      <img
                        src={app.user.image}
                        className="h-12 w-12 rounded-full border border-white/20 object-cover md:h-16 md:w-16"
                        alt={app.user.username}
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-black text-black">
                        {app.user.username[0]}
                      </div>
                    )}

                    <div>
                        <h2 className="text-2xl font-black text-white md:text-3xl">{app.name}</h2>
                      <p className="mt-1 text-sm text-gray-300">Discord: {app.user.username}</p>
                      <p className="text-xs text-gray-500">ID: {app.user.discordId}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <AdminStatusBadge value={app.status} />
                    <span className={`rounded-full border px-4 py-2 text-sm font-black ${
                      quality.level === "STRONG"
                        ? "border-green-400/25 bg-green-400/10 text-green-300"
                        : quality.level === "NORMAL"
                          ? "border-yellow-400/25 bg-yellow-400/10 text-yellow-300"
                          : "border-red-500/25 bg-red-500/10 text-red-300"
                    }`}>
                      QUALITY {quality.score} - {quality.label}
                    </span>
                    <span className="rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm text-gray-300">
                      {submittedAt}
                    </span>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-gray-500">العمر</p>
                    <p className="mt-2 font-bold text-white">{app.age}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-gray-500">المدينة</p>
                    <p className="mt-2 font-bold text-white">{app.city ?? "غير محدد"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-gray-500">ساعات اللعب / المايك</p>
                    <p className="mt-2 font-bold text-white">
                      {app.dailyHours ?? "غير محدد"} - {app.hasMic ? "معه مايك" : "بدون مايك"}
                    </p>
                  </div>
                  {app.reviewFlag && (
                    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 md:col-span-3">
                      <p className="text-xs text-yellow-300">تنبيه مراجعة</p>
                      <p className="mt-2 leading-8 text-white">{app.reviewFlag}</p>
                    </div>
                  )}
                  {quality.notes.length > 0 && (
                    <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 p-4 md:col-span-3">
                      <p className="text-xs text-orange-300">ملاحظات جودة التقديم</p>
                      <p className="mt-2 leading-8 text-white">{quality.notes.join("، ")}</p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                    <p className="text-xs text-gray-500">الخبرة</p>
                    <p className="mt-2 leading-8 text-white">{app.experience}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-3">
                    <p className="text-xs text-gray-500">سبب الانضمام</p>
                    <p className="mt-2 leading-8 text-white">{app.reason}</p>
                  </div>
                  {app.decisionReason && (
                    <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 md:col-span-3">
                      <p className="text-xs text-red-300">سبب الرفض</p>
                      <p className="mt-2 leading-8 text-white">{app.decisionReason}</p>
                    </div>
                  )}
                  {app.interviewNote && (
                    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 md:col-span-3">
                      <p className="text-xs text-yellow-300">معلومات المقابلة</p>
                      <p className="mt-2 leading-8 text-white">
                        {app.interviewAt ? `${app.interviewAt.toLocaleString("ar")} - ` : ""}
                        {app.interviewNote}
                      </p>
                    </div>
                  )}
                  {app.internalNote && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 md:col-span-3">
                      <p className="text-xs text-cyan-300">ملاحظة داخلية</p>
                      <p className="mt-2 leading-8 text-white">{app.internalNote}</p>
                    </div>
                  )}
                </div>

                <AdminDecisionButtons applicationId={app.id} status={app.status} />
              </article>
            );
          })}
        </section>}
      </div>
    </main>
  );
}

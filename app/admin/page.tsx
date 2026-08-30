import { prisma } from "@/lib/prisma";
import { getAdminContext, getDatabaseAdminIds, getOwnerAdminIds } from "@/lib/admin-permissions";
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
import { AdminSignOutButton } from "./AdminSignOutButton";
import { AdminManagerForm } from "./AdminManagerForm";
import { AdminWeeklyReportButton } from "./AdminWeeklyReportButton";
import { AdminDiagnosticsButton } from "./AdminDiagnosticsButton";
import { AdminEmptyState } from "./AdminEmptyState";
import { AdminStatusBadge } from "./AdminStatusBadge";
import { AdminSyncButton } from "./AdminSyncButton";
import { AdminSummonDeleteButton } from "./AdminSummonDeleteButton";
import { AdminSummonForm } from "./AdminSummonForm";
import { AdminDiscordRoleConfig } from "./AdminDiscordRoleConfig";
import { AdminWebhookConfig } from "./AdminWebhookConfig";
import { AdminSiteContent } from "./AdminSiteContent";
import { AdminAnalyticsPanel } from "./AdminAnalyticsPanel";
import { AdminBackupCenter } from "./AdminBackupCenter";
import { TokyoCommandPalette } from "../TokyoCommandPalette";
import { getTokyoRoleOverrides } from "@/lib/tokyo-role-settings";
import { ensureTokyoWebhooksSafely } from "@/lib/discord";
import { parseStoredSiteContent } from "@/lib/site-content";
import { STREAMER_APPLICATION_FLAG, isStreamerApplication } from "@/lib/application-types";
import Link from "next/link";
import Image from "next/image";
import { ensureCommandSchema } from "@/lib/command-schema";

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

const capabilityLabels: Record<string, string> = {
  ALL: "كامل الصلاحيات",
  APPLICATIONS: "إدارة التقديمات",
  STREAMERS: "إدارة تقديمات الستريمرز",
  OPERATIONS: "إدارة العمليات والحضور",
  WARNINGS: "إدارة التحذيرات",
  MEMBERS: "إدارة الأعضاء",
  LOGS: "سجل الإدارة",
};

const modeDetails: Record<string, { eyebrow: string; title: string; description: string }> = {
  OVERVIEW: {
    eyebrow: "مركز التحكم",
    title: "نظرة شاملة على كل عمليات الإدارة",
    description: "الأولويات الحالية، حالة النظام، وسرعة الوصول إلى التقديمات والأعضاء والانضباط والتقارير.",
  },
  APPLICATIONS: {
    eyebrow: "طلبات الانضمام",
    title: "مراجعة التقديمات واتخاذ القرار",
    description: "البحث والفلترة والمقابلات والقبول أو الرفض بدون تشتيت من أدوات الأقسام الأخرى.",
  },
  STREAMERS: {
    eyebrow: "فريق المحتوى",
    title: "تقديمات رتبة Streamer",
    description: "ملفات صناع المحتوى، روابط القنوات، المقابلات والقبول المباشر مع إعطاء رتبة Streamer.",
  },
  DISCIPLINE: {
    eyebrow: "الانضباط الداخلي",
    title: "الشكاوى والاستدعاءات والإجازات",
    description: "كل ما يخص متابعة المخالفات والقرارات الإدارية وسجل الحالات المفتوحة.",
  },
  MEMBERS: {
    eyebrow: "قاعدة الأعضاء",
    title: "ملفات أعضاء TOKYO",
    description: "افتح ملف أي عضو لمراجعة تقييمه وتحذيراته ورتبته وسجله الإداري.",
  },
  SYSTEM: {
    eyebrow: "إدارة النظام",
    title: "الإعدادات والتقارير والتكاملات",
    description: "أدوات Discord والإعلانات والتنبيهات وفريق الإدارة والتقرير الأسبوعي.",
  },
};

function readBoundedInteger(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) return fallback;

  return Math.min(max, Math.max(min, parsed));
}

function readSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

type AdminHrefOptions = {
  mode?: string;
  status?: string;
  query?: string;
  logs?: string;
  members?: string;
  page?: number;
};

function buildAdminHref({ mode = "OVERVIEW", status = "ALL", query = "", logs, members, page }: AdminHrefOptions) {
  const params = new URLSearchParams();

  if (mode !== "OVERVIEW") {
    params.set("mode", mode);
  }

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (query) {
    params.set("q", query);
  }

  if (logs) {
    params.set("logs", logs);
  }

  if (members && members !== "ALL") {
    params.set("members", members);
  }

  if (page && page > 1) {
    params.set("page", String(page));
  }

  const value = params.toString();
  return value ? `/admin?${value}` : "/admin";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await getAdminContext();
  const params = await searchParams;
  const statusParam = readSearchParam(params?.status);
  const modeParam = readSearchParam(params?.mode);
  const memberParam = readSearchParam(params?.members);
  const activeStatus = ["PRIORITY", "PENDING", "ACCEPTED", "REJECTED", "INTERVIEW", "TRIAL"].includes(statusParam)
    ? statusParam
    : "ALL";
  const query = readSearchParam(params?.q).trim();
  const showAllLogs = readSearchParam(params?.logs) === "all";
  const requestedMode = ["OVERVIEW", "APPLICATIONS", "STREAMERS", "DISCIPLINE", "MEMBERS", "SYSTEM"].includes(modeParam) ? modeParam : "OVERVIEW";
  const memberFilter = ["WARNED", "HIGH_RISK", "LEAVE", "SUMMONED", "RISK"].includes(memberParam)
    ? memberParam
    : "ALL";
  // eslint-disable-next-line react-hooks/purity
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const applicationPageSize = readBoundedInteger(process.env.TOKYO_ADMIN_PAGE_SIZE, 24, 8, 60);
  const activityWindowDays = readBoundedInteger(process.env.TOKYO_REPORT_DAYS, 7, 1, 30);
  const memberSyncIntervalSeconds = readBoundedInteger(process.env.TOKYO_SYNC_SECONDS, 60, 15, 300);
  const applicationPage = readBoundedInteger(readSearchParam(params?.page), 1, 1, 10_000);
  // eslint-disable-next-line react-hooks/purity
  const activitySince = new Date(Date.now() - activityWindowDays * 24 * 60 * 60 * 1000);

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
          <p className="mt-5 text-sm text-gray-300">هذا الحساب لا يملك صلاحية دخول لوحة الإدارة.</p>
        </div>
      </main>
    );
  }

  const canAccessMode = (candidate: string) => {
    if (admin.capabilities.ALL) return true;
    if (candidate === "APPLICATIONS") return admin.capabilities.APPLICATIONS;
    if (candidate === "STREAMERS") return admin.capabilities.STREAMERS;
    if (candidate === "DISCIPLINE") return admin.capabilities.WARNINGS;
    if (candidate === "MEMBERS") return admin.capabilities.MEMBERS;
    if (candidate === "SYSTEM") return admin.capabilities.LOGS;
    return false;
  };
  const defaultMode = admin.capabilities.ALL
    ? "OVERVIEW"
    : admin.capabilities.APPLICATIONS
      ? "APPLICATIONS"
      : admin.capabilities.STREAMERS
        ? "STREAMERS"
        : admin.capabilities.WARNINGS
          ? "DISCIPLINE"
          : admin.capabilities.MEMBERS
            ? "MEMBERS"
            : "SYSTEM";
  const mode = canAccessMode(requestedMode) ? requestedMode : defaultMode;
  const applicationMode = mode === "APPLICATIONS" || mode === "STREAMERS";
  const shouldSyncMembers = mode === "OVERVIEW" || mode === "MEMBERS" || mode === "DISCIPLINE" || mode === "SYSTEM";
  const tokyoSync = shouldSyncMembers ? await syncTokyoMembersSafely() : null;

  if (shouldSyncMembers) {
    await syncWarningsSafely();
  }

  await ensureCommandSchema();

  const regularApplicationScope = {
    OR: [{ reviewFlag: null }, { reviewFlag: { not: STREAMER_APPLICATION_FLAG } }],
  };
  const streamerApplicationScope = { reviewFlag: STREAMER_APPLICATION_FLAG };
  const applicationScope = mode === "STREAMERS" ? streamerApplicationScope : regularApplicationScope;
  const applicationWhere = {
    AND: [applicationScope],
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
  };

  const [
    applications,
    filteredApplicationCount,
    totalApplications,
    pendingApplicationCount,
    pendingStreamerApplicationCount,
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
    weeklyRejected,
    weeklyWarnings,
    weeklySummons,
    weeklyComplaints,
    adminActivity,
    knownUsers,
    activeSiteAlerts,
  ] = await Promise.all([
    prisma.application.findMany({
      where: applicationWhere,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (applicationPage - 1) * applicationPageSize,
      take: applicationPageSize,
    }),
    prisma.application.count({ where: applicationWhere }),
    prisma.application.count({ where: regularApplicationScope }),
    prisma.application.count({ where: { AND: [regularApplicationScope], status: "PENDING" } }),
    prisma.application.count({ where: { status: "PENDING", reviewFlag: STREAMER_APPLICATION_FLAG } }),
    prisma.application.count({ where: { AND: [regularApplicationScope], status: "ACCEPTED" } }),
    prisma.application.count({ where: { AND: [regularApplicationScope], status: "REJECTED" } }),
    prisma.application.count({ where: { AND: [regularApplicationScope], status: "TRIAL" } }),
    prisma.application.count({ where: { AND: [regularApplicationScope], status: "PENDING", createdAt: { gte: dayAgo } } }),
    prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.tokyoMember.findMany({
      where: { inTokyoRole: true },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        username: true,
        discordId: true,
        image: true,
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
    prisma.application.count({ where: { createdAt: { gte: activitySince } } }),
    prisma.application.count({ where: { status: "ACCEPTED", decidedAt: { gte: activitySince } } }),
    prisma.application.count({ where: { status: "REJECTED", decidedAt: { gte: activitySince } } }),
    prisma.memberWarning.count({ where: { createdAt: { gte: activitySince } } }),
    prisma.summon.count({ where: { createdAt: { gte: activitySince } } }),
    prisma.complaint.count({ where: { createdAt: { gte: activitySince } } }),
    prisma.adminLog.groupBy({
      by: ["adminDiscordId"],
      where: {
        createdAt: { gte: activitySince },
        adminDiscordId: { not: null },
      },
      _count: { _all: true },
      orderBy: { _count: { adminDiscordId: "desc" } },
      take: 6,
    }),
    prisma.user.findMany({
      orderBy: { username: "asc" },
      select: {
        discordId: true,
        username: true,
        image: true,
      },
    }),
    mode === "SYSTEM"
      ? prisma.siteAlert.findMany({
          where: {
            active: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            message: true,
            expiresAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const memberByDiscordId = new Map(tokyoMembers.map((member) => [member.discordId, member]));
  const userByDiscordId = new Map(knownUsers.map((user) => [user.discordId, user]));
  const getAdminDisplayName = (discordId: string | null) => {
    if (!discordId) return "النظام";
    if (discordId === admin.id) return admin.name;

    return memberByDiscordId.get(discordId)?.displayName ?? userByDiscordId.get(discordId)?.username ?? "إداري";
  };

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
    ["بوت Discord", process.env.DISCORD_BOT_TOKEN ? "متصل" : "غير مربوط"],
    ["Kick Live", process.env.KICK_CLIENT_ID && process.env.KICK_CLIENT_SECRET ? "متصل" : "جاهز للربط"],
    ["قاعدة البيانات", "متصلة"],
    ["مزامنة الأعضاء", tokyoSync ? `${tokyoSync.count} عضو` : `كل ${memberSyncIntervalSeconds} ثانية`],
    ["مزامنة التحذيرات", "عند الحاجة"],
    ["التقديمات", `${applicationPageSize} لكل صفحة`],
    ["نافذة التقارير", `${activityWindowDays} أيام`],
  ];
  const highRiskMemberCount = tokyoMembers.filter((member) => {
    const risk = calculateMemberRisk(member);
    return risk.level === "HIGH" || risk.level === "CRITICAL";
  }).length;
  const quickReviewItems = [
    ["تقديمات للمراجعة", pendingApplicationCount],
    ["تحذيرات قرب الانتهاء", warningCount],
    ["أعضاء Risk عالي", highRiskMemberCount],
    ["شكاوي مفتوحة", complaints.filter((item) => item.status !== "RESOLVED" && item.status !== "DISMISSED").length],
    ["إجازات معلقة", pendingLeaves.length],
  ];
  const visibleCapabilities = admin.capabilities.ALL
    ? ["ALL"]
    : Object.entries(admin.capabilities)
        .filter(([, enabled]) => enabled)
        .map(([capability]) => capability);
  const activeModeDetails = modeDetails[mode ?? "OVERVIEW"] ?? modeDetails.OVERVIEW;
  const applicationPageCount = Math.max(1, Math.ceil(filteredApplicationCount / applicationPageSize));
  const tokyoRoleOverrides = await getTokyoRoleOverrides();
  const tokyoWebhookStatuses = mode === "SYSTEM" ? await ensureTokyoWebhooksSafely() : [];
  const siteContentSetting = mode === "SYSTEM"
    ? await prisma.siteSetting.findUnique({ where: { key: "siteContentV2" }, select: { value: true } })
    : null;
  const siteContent = parseStoredSiteContent(siteContentSetting?.value);
  const moduleCards = [
    {
      mode: "APPLICATIONS",
      label: "التقديمات",
      value: pendingApplicationCount,
      detail: "طلب ينتظر قرار الإدارة",
      features: ["قبول ورفض", "مقابلات", "فترة تجربة"],
      tone: "border-yellow-400/25 bg-yellow-400/10 text-yellow-200",
    },
    {
      mode: "STREAMERS",
      label: "تقديمات الستريمرز",
      value: pendingStreamerApplicationCount,
      detail: "ملف Streamer ينتظر المراجعة",
      features: ["روابط القنوات", "مقابلات", "رتبة تلقائية"],
      tone: "border-lime-400/25 bg-lime-400/10 text-lime-200",
    },
    {
      mode: "DISCIPLINE",
      label: "الانضباط والشكاوى",
      value: complaints.filter((item) => item.status !== "RESOLVED" && item.status !== "DISMISSED").length + activeSummons.filter((item) => item.status === "ACTIVE").length,
      detail: "حالة مفتوحة تحتاج متابعة",
      features: ["شكاوى وتصويت", "استدعاءات", "إجازات"],
      tone: "border-red-400/25 bg-red-400/10 text-red-200",
    },
    {
      mode: "MEMBERS",
      label: "ملفات الأعضاء",
      value: tokyoMembers.length,
      detail: `${highRiskMemberCount} أعضاء بمستوى خطورة مرتفع`,
      features: ["تحذيرات", "رتب وتقييم", "بلاك ليست"],
      tone: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
    },
    {
      mode: "SYSTEM",
      label: "النظام والتقارير",
      value: adminLogCount,
      detail: "حدث مسجل في لوحة الإدارة",
      features: ["إعلانات وتنبيهات", "فريق الإدارة", "تقارير وتشخيص"],
      tone: "border-green-400/25 bg-green-400/10 text-green-200",
    },
  ].filter((card) => canAccessMode(card.mode));
  const adminNavigation = [
    { label: "نظرة عامة", value: "OVERVIEW", hint: "مركز القيادة", badge: quickReviewItems.reduce((sum, [, value]) => sum + Number(value), 0) },
    { label: "التقديمات", value: "APPLICATIONS", hint: "الطلبات والقرارات", badge: pendingApplicationCount },
    { label: "الستريمرز", value: "STREAMERS", hint: "تقديمات فريق المحتوى", badge: pendingStreamerApplicationCount },
    { label: "الانضباط", value: "DISCIPLINE", hint: "الشكاوى والاستدعاءات", badge: complaints.filter((item) => item.status !== "RESOLVED" && item.status !== "DISMISSED").length },
    { label: "الأعضاء", value: "MEMBERS", hint: "الملفات والمخاطر", badge: highRiskMemberCount },
    { label: "النظام", value: "SYSTEM", hint: "التقارير والتكاملات", badge: 0 },
  ].filter((item) => canAccessMode(item.value));

  return (
    <main dir="rtl" className="tokyo-dashboard relative min-h-screen overflow-hidden px-3 py-5 text-white sm:px-5 md:p-10">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:100%_6px,80px_80px] opacity-55" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(239,68,68,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.10),transparent_26%),radial-gradient(circle_at_center,transparent_42%,rgba(0,0,0,0.72)_100%)]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="tokyo-glass mb-6 rounded-2xl p-5 md:mb-10 md:rounded-[32px] md:p-8">
          <div className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 right-0 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-3xl" />
          <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-4 text-[10px] font-black tracking-[3px] text-gray-500 sm:flex-row sm:items-center sm:justify-between md:mb-6 md:text-xs md:tracking-[4px]">
            <span>مركز قيادة TOKYO</span>
            <span className="flex w-fit items-center gap-2 rounded-full border border-green-400/15 bg-green-400/[0.07] px-3 py-1.5 text-green-400">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_lime]" />
              النظام يعمل
            </span>
          </div>
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black tracking-[5px] text-red-500 md:text-sm md:tracking-[6px]">TOKYO ADMIN</p>
            <h1 className="tokyo-section-title mt-3 text-3xl font-black leading-tight drop-shadow-[0_0_28px_rgba(255,255,255,0.35)] sm:text-4xl md:text-6xl">
              لوحة الإدارة المركزية
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-400 md:text-base">
              كل قرارات العصابة وملفات الأعضاء والانضباط والتقارير في مركز واحد سريع وواضح.
            </p>
          </div>

          <div className="w-fit rounded-2xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-gray-300 shadow-[0_16px_38px_rgba(0,0,0,0.28)] md:px-5">
            <span className="block text-[10px] font-black tracking-[3px] text-gray-500">ACTIVE OPERATOR</span>
            <span className="mt-1 block font-black text-white">{admin.name}</span>
          </div>
          </div>
          <div className="relative mt-7 grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            {[
              ["بانتظار القرار", pendingApplicationCount],
              ["حالات مفتوحة", complaints.filter((item) => item.status !== "RESOLVED" && item.status !== "DISMISSED").length + activeSummons.filter((item) => item.status === "ACTIVE").length],
              ["أعضاء مراقبون", highRiskMemberCount],
            ].map(([label, value]) => (
              <div key={label} className="border-l border-white/10 p-3 last:border-l-0 md:p-4">
                <p className="text-[10px] text-gray-500 md:text-xs">{label}</p>
                <p className="mt-1 text-xl font-black text-white md:text-2xl">{value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:mb-8 lg:flex lg:flex-wrap">
          <Link
            href="/"
            className="rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 text-center text-sm font-black text-gray-300 transition hover:border-white/30 hover:text-white"
          >
            الرجوع للرئيسية
          </Link>
          <AdminSignOutButton />
          {(admin.capabilities.ALL || admin.capabilities.OPERATIONS) && (
            <Link
              href="/admin/operations"
              className="flex items-center justify-center gap-2 rounded-2xl border border-red-400/25 bg-red-400/10 px-5 py-3 text-sm font-black text-red-200 transition hover:border-red-400/45 hover:bg-red-400/15"
            >
              مركز العمليات
            </Link>
          )}
          {(admin.capabilities.ALL || admin.capabilities.MEMBERS) && (
            <Link href="/admin/progression" className="flex items-center justify-center rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-200 transition hover:bg-yellow-400/15">المهام والترقيات</Link>
          )}
          {(admin.capabilities.ALL || admin.capabilities.STREAMERS) && (
            <Link href="/admin/media" className="flex items-center justify-center rounded-2xl border border-green-400/25 bg-green-400/10 px-5 py-3 text-sm font-black text-green-200 transition hover:bg-green-400/15">مركز الستريمرز</Link>
          )}
          {(admin.capabilities.ALL || admin.capabilities.LOGS) && (
            <Link href="/admin/security" className="flex items-center justify-center rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200 transition hover:bg-cyan-400/15">مركز الأمن</Link>
          )}
          <TokyoCommandPalette
            variant="admin"
            label="بحث سريع"
            members={tokyoMembers.map((member) => ({ id: member.id, name: member.displayName, username: member.username }))}
            className="flex items-center justify-center gap-2 rounded-2xl border border-red-400/20 bg-red-400/[0.07] px-5 py-3 text-sm font-black text-red-200 transition hover:border-red-400/40 hover:bg-red-400/15"
          />
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-center text-sm font-black text-cyan-300">
            {tokyoSync ? `تمت مزامنة ${tokyoSync.count} عضو` : "البيانات مستقرة — بدون تحديث تلقائي"}
          </div>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-3 md:mb-10 md:gap-4 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div
              key={label}
              className="tokyo-admin-stat tokyo-glass group rounded-2xl p-4 md:rounded-3xl md:p-6"
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

        <section className="tokyo-glass mb-8 rounded-2xl p-5 md:mb-10 md:rounded-3xl md:p-6">
          <p className="text-xs font-black tracking-[5px] text-white">نظرة سريعة</p>
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
            {quickReviewItems.map(([label, value]) => (
              <div key={label} className="tokyo-admin-stat rounded-2xl border border-white/10 bg-black/40 p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="mt-2 text-3xl font-black text-white">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 grid gap-4 md:mb-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="tokyo-glass rounded-2xl border-cyan-400/20 p-5 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-cyan-300">حالة النظام</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {healthItems.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className={`mt-2 font-black ${value === "غير مربوط" ? "text-red-300" : "text-green-300"}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="tokyo-glass rounded-2xl p-5 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-white">صلاحيات الحساب</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {visibleCapabilities.map((capability) => (
                  <span key={capability} className="rounded-full border border-green-400/25 bg-green-400/10 px-4 py-2 text-xs font-black text-green-300">
                    {capabilityLabels[capability] ?? capability}
                  </span>
                ))}
            </div>
          </div>
        </section>

        <section className="tokyo-scrollbar sticky top-2 z-40 mb-8 grid auto-cols-[minmax(150px,1fr)] grid-flow-col gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/85 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.36)] backdrop-blur-2xl md:mb-10 md:auto-cols-fr md:overflow-visible md:rounded-3xl">
          {adminNavigation.map((item) => (
            <Link
              key={item.value}
              href={buildAdminHref({ mode: item.value, query })}
              aria-current={mode === item.value ? "page" : undefined}
              className={`group relative min-w-0 rounded-2xl border px-4 py-3 text-xs font-black transition ${
                mode === item.value ? "border-white bg-white text-black shadow-[0_12px_35px_rgba(255,255,255,0.13)]" : "border-transparent text-gray-300 hover:border-white/15 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <span className="block">{item.label}</span>
              <span className={`mt-1 block truncate text-[9px] font-bold ${mode === item.value ? "text-black/55" : "text-gray-600 group-hover:text-gray-400"}`}>{item.hint}</span>
              {item.badge > 0 && (
                <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[9px] ${mode === item.value ? "bg-black text-white" : "bg-red-500/15 text-red-300"}`}>
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </section>

        <section className="tokyo-panel mb-8 p-5 md:mb-10 md:p-7">
          <p className="text-xs font-black tracking-[4px] text-red-400">{activeModeDetails.eyebrow}</p>
          <h2 className="tokyo-section-title mt-3 text-2xl font-black text-white md:text-4xl">{activeModeDetails.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-400">{activeModeDetails.description}</p>
        </section>

        {mode === "OVERVIEW" && (
          <section className="mb-8 grid gap-4 md:mb-10 md:grid-cols-2 xl:grid-cols-4">
            {(admin.capabilities.ALL || admin.capabilities.OPERATIONS) && (
              <Link
                href="/admin/operations"
                className="tokyo-admin-stat group relative overflow-hidden rounded-3xl border border-red-400/25 bg-red-400/10 p-5 text-red-200 transition duration-300 hover:shadow-[0_24px_70px_rgba(239,68,68,0.14)]"
              >
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-red-300 to-transparent opacity-60" />
                <p className="text-sm font-black">مركز العمليات</p>
                <p className="mt-4 text-4xl font-black text-white">OPS</p>
                <p className="mt-2 text-xs leading-6 opacity-75">تخطيط، تكليف، حضور ونتائج</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {['قائد وفريق', 'متابعة مباشرة', 'أرشيف النتائج'].map((feature) => (
                    <span key={feature} className="rounded-full border border-current/20 bg-black/20 px-2.5 py-1 text-[10px] font-black text-white/80">{feature}</span>
                  ))}
                </div>
                <span className="mt-5 inline-flex text-xs font-black text-white transition group-hover:translate-x-[-4px]">فتح المركز ←</span>
              </Link>
            )}
            {moduleCards.map((card) => (
              <Link
                key={card.mode}
                href={buildAdminHref({ mode: card.mode })}
                className={`tokyo-admin-stat group relative overflow-hidden rounded-3xl border p-5 transition duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,0.35)] ${card.tone}`}
              >
                <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-50" />
                <p className="text-sm font-black">{card.label}</p>
                <p className="mt-4 text-4xl font-black text-white">{card.value}</p>
                <p className="mt-2 text-xs leading-6 opacity-75">{card.detail}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {card.features.map((feature) => (
                    <span key={feature} className="rounded-full border border-current/20 bg-black/20 px-2.5 py-1 text-[10px] font-black text-white/80">
                      {feature}
                    </span>
                  ))}
                </div>
                <span className="mt-5 inline-flex text-xs font-black text-white transition group-hover:translate-x-[-4px]">فتح القسم ←</span>
              </Link>
            ))}
          </section>
        )}

        {(mode === "SYSTEM" || mode === "OVERVIEW") && (
          <section className="mb-8 grid gap-3 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.04] p-4 sm:grid-cols-2 lg:mb-10 lg:flex lg:flex-wrap">
            <div className="flex items-center px-2 text-xs font-black tracking-[3px] text-cyan-200">أدوات سريعة</div>
            <AdminDiscordTestButton />
            <AdminDiagnosticsButton />
            <AdminSyncButton />
          </section>
        )}

        {(mode === "MEMBERS" || mode === "SYSTEM") && (
          <AdminDiscordRoleConfig
            initialOverrides={tokyoRoleOverrides}
            currentMemberCount={tokyoMembers.length}
          />
        )}

        {mode === "SYSTEM" && <AdminWebhookConfig initialStatuses={tokyoWebhookStatuses} />}

        {mode === "SYSTEM" && <AdminSiteContent initialContent={siteContent} />}

        {mode === "SYSTEM" && admin.isOwner && <AdminBackupCenter />}

        {mode === "SYSTEM" && <AdminAnnouncementForm />}
        {mode === "SYSTEM" && (
          <AdminAlertForm
            activeAlerts={activeSiteAlerts.map((alert) => ({
              id: alert.id,
              title: alert.title,
              message: alert.message,
              expiresLabel: alert.expiresAt
                ? new Intl.DateTimeFormat("ar-JO", {
                    dateStyle: "short",
                    timeStyle: "short",
                    timeZone: "Europe/Stockholm",
                  }).format(alert.expiresAt)
                : null,
            }))}
          />
        )}
        {mode === "SYSTEM" && admin.isOwner && (
          <AdminManagerForm
            admins={extraAdmins.map((discordId) => ({
              discordId,
              name: getAdminDisplayName(discordId),
              username: userByDiscordId.get(discordId)?.username ?? memberByDiscordId.get(discordId)?.username ?? null,
              image: userByDiscordId.get(discordId)?.image ?? null,
            }))}
            candidates={tokyoMembers
              .filter((member) => !extraAdmins.includes(member.discordId) && !getOwnerAdminIds().includes(member.discordId))
              .map((member) => ({
                discordId: member.discordId,
                name: member.displayName,
                username: member.username,
                image: member.image,
              }))}
          />
        )}
        {mode === "DISCIPLINE" && <AdminSummonForm members={tokyoMembers} />}

        {(mode === "OVERVIEW" || mode === "DISCIPLINE" || mode === "MEMBERS" || mode === "SYSTEM") && pendingLeaves.length > 0 && (
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

        {(mode === "OVERVIEW" || mode === "DISCIPLINE" || mode === "SYSTEM") && <section className="mb-8 grid gap-4 lg:mb-10 lg:grid-cols-[0.9fr_1.1fr]">
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
                  href={buildAdminHref({ mode, status: activeStatus ?? "ALL", query, logs: showAllLogs ? undefined : "all" })}
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
                <p className="mt-1 text-xs text-gray-500">آخر {activityWindowDays} أيام من نشاط الإدارة والنظام.</p>
              </div>
              <AdminWeeklyReportButton />
            </div>
            <AdminAnalyticsPanel
              applications={weeklyApplications}
              accepted={weeklyAccepted}
              rejected={weeklyRejected}
              warnings={weeklyWarnings}
              summons={weeklySummons}
              complaints={weeklyComplaints}
              adminScores={adminActivity.map((item) => ({
                name: getAdminDisplayName(item.adminDiscordId),
                value: item._count._all,
              }))}
            />
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
                href={buildAdminHref({ mode: "MEMBERS", members: value, query })}
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

        {(mode === "OVERVIEW" || mode === "SYSTEM" || applicationMode) && announcements.length > 0 && (
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

        {applicationMode && <section className="sticky top-2 z-40 mb-8 rounded-2xl border border-white/10 bg-black/85 p-3 backdrop-blur-xl md:top-0 md:rounded-3xl md:p-4">
          <form className="mb-4 flex flex-col gap-3 md:flex-row" action="/admin">
            <input type="hidden" name="mode" value={mode} />
            {activeStatus !== "ALL" && <input type="hidden" name="status" value={activeStatus} />}
            <input
              name="q"
              defaultValue={query}
              placeholder="ابحث بالاسم أو اسم المستخدم..."
              className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 outline-none"
            />
            <button className="rounded-2xl bg-white px-6 py-3 font-black text-black transition hover:bg-gray-300">
              بحث
            </button>
            {query && (
              <Link href={buildAdminHref({ mode, status: activeStatus ?? "ALL" })} className="rounded-2xl border border-white/15 px-6 py-3 text-center font-black text-gray-300">
                مسح
              </Link>
            )}
          </form>
          <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0">
          {filterTabs.map(([label, status]) => {
            const href = buildAdminHref({ mode, status, query });
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

        {applicationMode && <section className="grid gap-5 md:gap-6">
          {applications.length === 0 && <AdminEmptyState title={mode === "STREAMERS" ? "لا توجد تقديمات Streamer" : "لا توجد تقديمات"} message="لا توجد طلبات مطابقة للفلاتر الحالية." />}
          {applications.map((app) => {
            const style = statusStyles[app.status] ?? statusStyles.PENDING;
            const streamerApplication = isStreamerApplication(app.reviewFlag);
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
                      <Image
                        src={app.user.image}
                        width={64}
                        height={64}
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
                      <p className="mt-1 text-sm text-gray-300">@{app.user.username}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <AdminStatusBadge value={app.status} />
                    {!streamerApplication && <span className={`rounded-full border px-4 py-2 text-sm font-black ${
                      quality.level === "STRONG"
                        ? "border-green-400/25 bg-green-400/10 text-green-300"
                        : quality.level === "NORMAL"
                          ? "border-yellow-400/25 bg-yellow-400/10 text-yellow-300"
                          : "border-red-500/25 bg-red-500/10 text-red-300"
                    }`}>
                      QUALITY {quality.score} - {quality.label}
                    </span>}
                    {streamerApplication && <span className="rounded-full border border-lime-400/25 bg-lime-400/10 px-4 py-2 text-sm font-black text-lime-300">STREAMER FILE</span>}
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
                    <p className="text-xs text-gray-500">{streamerApplication ? "منصة البث" : "المدينة"}</p>
                    <p className="mt-2 font-bold text-white">{app.city ?? "غير محدد"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                    <p className="text-xs text-gray-500">{streamerApplication ? "التفرغ / المايك" : "ساعات اللعب / المايك"}</p>
                    <p className="mt-2 font-bold text-white">
                      {app.dailyHours ?? "غير محدد"} - {app.hasMic ? "معه مايك" : "بدون مايك"}
                    </p>
                  </div>
                  {app.reviewFlag && !streamerApplication && (
                    <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 md:col-span-3">
                      <p className="text-xs text-yellow-300">تنبيه مراجعة</p>
                      <p className="mt-2 leading-8 text-white">{app.reviewFlag}</p>
                    </div>
                  )}
                  {!streamerApplication && quality.notes.length > 0 && (
                    <div className="rounded-2xl border border-orange-400/20 bg-orange-400/10 p-4 md:col-span-3">
                      <p className="text-xs text-orange-300">ملاحظات جودة التقديم</p>
                      <p className="mt-2 leading-8 text-white">{quality.notes.join("، ")}</p>
                    </div>
                  )}
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                    <p className="text-xs text-gray-500">{streamerApplication ? "رابط القناة" : "الخبرة"}</p>
                    {streamerApplication ? (
                      <a href={app.experience} target="_blank" rel="noreferrer" dir="ltr" className="mt-2 block break-all text-left font-bold leading-8 text-lime-300 hover:text-white">{app.experience}</a>
                    ) : (
                      <p className="mt-2 leading-8 text-white">{app.experience}</p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-3">
                    <p className="text-xs text-gray-500">{streamerApplication ? "الخبرة ونوع المحتوى" : "سبب الانضمام"}</p>
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
                        {app.interviewAt ? `${app.interviewAt.toLocaleString("ar", { timeZone: "Europe/Stockholm" })} - ` : ""}
                        {app.interviewNote}
                      </p>
                      {app.interviewAssignedTo && <p className="mt-2 text-xs font-black text-cyan-300">المسؤول: {app.interviewAssignedTo}</p>}
                      {app.interviewScore !== null && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">التقييم {app.interviewScore}/100</span>
                          {app.interviewAttendance && <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300">{app.interviewAttendance}</span>}
                        </div>
                      )}
                      {app.interviewEvaluation && <p className="mt-3 text-sm leading-7 text-zinc-300">{app.interviewEvaluation}</p>}
                    </div>
                  )}
                  {app.internalNote && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 md:col-span-3">
                      <p className="text-xs text-cyan-300">ملاحظة داخلية</p>
                      <p className="mt-2 leading-8 text-white">{app.internalNote}</p>
                    </div>
                  )}
                </div>

                <AdminDecisionButtons applicationId={app.id} status={app.status} applicationType={streamerApplication ? "STREAMER" : "GANG"} interviewAssignedTo={app.interviewAssignedTo} interviewScore={app.interviewScore} />
              </article>
            );
          })}
          {applicationPageCount > 1 && (
            <nav className="tokyo-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" aria-label="صفحات التقديمات">
              <p className="text-sm text-gray-400">
                صفحة <span className="font-black text-white">{Math.min(applicationPage, applicationPageCount)}</span> من {applicationPageCount} — {filteredApplicationCount} نتيجة
              </p>
              <div className="flex gap-2">
                {applicationPage > 1 && (
                  <Link
                    href={buildAdminHref({ mode, status: activeStatus ?? "ALL", query, page: applicationPage - 1 })}
                    className="rounded-xl border border-white/15 px-5 py-3 text-sm font-black text-gray-200 transition hover:border-white/35 hover:text-white"
                  >
                    السابق
                  </Link>
                )}
                {applicationPage < applicationPageCount && (
                  <Link
                    href={buildAdminHref({ mode, status: activeStatus ?? "ALL", query, page: applicationPage + 1 })}
                    className="rounded-xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-gray-300"
                  >
                    التالي
                  </Link>
                )}
              </div>
            </nav>
          )}
        </section>}
      </div>
    </main>
  );
}

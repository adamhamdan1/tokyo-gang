import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminDecisionButtons } from "./AdminDecisionButtons";
import { AdminAnnouncementDeleteButton } from "./AdminAnnouncementDeleteButton";
import { AdminAnnouncementForm } from "./AdminAnnouncementForm";
import { AdminComplaintActions } from "./AdminComplaintActions";
import { AdminDiscordTestButton } from "./AdminDiscordTestButton";
import { AdminSignOutButton } from "./AdminSignOutButton";
import { AdminSyncButton } from "./AdminSyncButton";
import { AdminSummonForm } from "./AdminSummonForm";
import { AdminTokyoMemberSyncButton } from "./AdminTokyoMemberSyncButton";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  PENDING: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.12)]",
  ACCEPTED: "border-green-400/40 bg-green-400/10 text-green-300 shadow-[0_0_24px_rgba(74,222,128,0.12)]",
  REJECTED: "border-red-500/40 bg-red-500/10 text-red-300 shadow-[0_0_24px_rgba(239,68,68,0.14)]",
  INTERVIEW: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.12)]",
  TRIAL: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.12)]",
};

const statusLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  INTERVIEW: "مقابلة",
  TRIAL: "فترة تجربة",
};

const filterTabs = [
  ["الكل", "ALL"],
  ["قيد المراجعة", "PENDING"],
  ["المقبولين", "ACCEPTED"],
  ["المرفوضين", "REJECTED"],
  ["المقابلات", "INTERVIEW"],
  ["فترة التجربة", "TRIAL"],
];

function buildAdminHref(status: string, query: string) {
  const params = new URLSearchParams();

  if (status !== "ALL") {
    params.set("status", status);
  }

  if (query) {
    params.set("q", query);
  }

  const value = params.toString();
  return value ? `/admin?${value}` : "/admin";
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; q?: string }>;
}) {
  const session = await auth();
  const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()) || [];
  const params = await searchParams;
  const activeStatus = ["PENDING", "ACCEPTED", "REJECTED", "INTERVIEW", "TRIAL"].includes(params?.status ?? "")
    ? params?.status
    : "ALL";
  const query = params?.q?.trim() ?? "";
  // eslint-disable-next-line react-hooks/purity
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return (
      <main dir="rtl" className="min-h-screen bg-black text-white flex items-center justify-center p-8">
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-10 py-8 text-center shadow-[0_0_45px_rgba(239,68,68,0.16)]">
          <p className="text-sm font-black tracking-[6px] text-red-400">ACCESS DENIED</p>
          <h1 className="mt-4 text-5xl font-black">ممنوع الدخول</h1>
          <p className="mt-5 text-sm text-gray-300">
            Discord ID الحالي: {session?.user?.id ?? "غير مسجل دخول"}
          </p>
        </div>
      </main>
    );
  }

  const [
    applications,
    memberCount,
    totalApplications,
    acceptedApplications,
    rejectedApplications,
    trialApplications,
    newPendingApplications,
    announcements,
    tokyoMembers,
    activeSummons,
    complaints,
  ] = await Promise.all([
    prisma.application.findMany({
      where: {
        ...(activeStatus === "ALL" ? {} : { status: activeStatus }),
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
    prisma.user.count(),
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
      },
    }),
  ]);

  const stats = [
    ["عدد الأعضاء", memberCount],
    ["عدد التقديمات", totalApplications],
    ["عدد المقبولين", acceptedApplications],
    ["فترة التجربة", trialApplications],
    ["أعضاء TOKYO", tokyoMembers.length],
    ["عدد المرفوضين", rejectedApplications],
  ];

  return (
    <main dir="rtl" className="min-h-screen bg-black text-white p-6 md:p-10">
      <Link
        href="/"
        className="fixed left-5 top-5 z-50 rounded-2xl border border-white/20 bg-white px-5 py-3 text-sm font-black text-black shadow-[0_0_28px_rgba(255,255,255,0.2)] transition hover:bg-gray-300"
      >
        الرئيسية
      </Link>

      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-4 border-b border-white/10 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-black tracking-[6px] text-red-500">TOKYO ADMIN</p>
            <h1 className="mt-3 text-5xl font-black drop-shadow-[0_0_28px_rgba(255,255,255,0.35)]">
              لوحة إدارة التقديمات
            </h1>
          </div>

          <div className="rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 text-sm text-gray-300">
            {session.user.name}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 text-sm font-black text-gray-300 transition hover:border-white/30 hover:text-white"
          >
            الرجوع للرئيسية
          </Link>
          <AdminDiscordTestButton />
          <AdminSyncButton />
          <AdminTokyoMemberSyncButton />
          <AdminSignOutButton />
        </div>

        <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <div
              key={label}
              className="rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-[0_0_40px_rgba(255,255,255,0.06)]"
            >
              <p className="text-sm text-gray-400">{label}</p>
              <p className="mt-3 text-5xl font-black text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.35)]">
                {value}
              </p>
            </div>
          ))}
        </section>

        <AdminAnnouncementForm />

        <AdminSummonForm members={tokyoMembers} />

        {complaints.length > 0 && (
          <section className="mb-10 rounded-3xl border border-red-500/20 bg-zinc-950 p-6">
            <p className="text-xs font-black tracking-[5px] text-red-400">MEMBER COMPLAINTS</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {complaints.map((complaint) => (
                <article key={complaint.id} className="rounded-2xl border border-white/10 bg-black/40 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-gray-500">المشتكي</p>
                      <p className="font-black text-white">{complaint.reporter.displayName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">المشكو عليه</p>
                      <p className="font-black text-white">{complaint.accused.displayName}</p>
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
                  <AdminComplaintActions complaintId={complaint.id} status={complaint.status} />
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSummons.length > 0 && (
          <section className="mb-10 rounded-3xl border border-cyan-400/20 bg-zinc-950 p-6">
            <p className="text-xs font-black tracking-[5px] text-cyan-300">RECENT SUMMONS</p>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {activeSummons.map((summon) => (
                <article key={summon.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-white">{summon.member.displayName}</p>
                    <span className="rounded-full border border-cyan-400/30 px-3 py-1 text-xs font-black text-cyan-300">
                      {summon.status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-400">{summon.reason}</p>
                  {summon.details && <p className="mt-2 text-xs text-gray-500">{summon.details}</p>}
                </article>
              ))}
            </div>
          </section>
        )}

        {announcements.length > 0 && (
          <section className="mb-10 grid gap-4 md:grid-cols-2">
            {announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-3xl border border-white/15 bg-zinc-950 p-6">
                <p className="text-xs font-black tracking-[4px] text-red-500">TOKYO NOTICE</p>
                <h3 className="mt-3 text-2xl font-black">{announcement.title}</h3>
                <p className="mt-3 leading-8 text-gray-400">{announcement.message}</p>
                <AdminAnnouncementDeleteButton id={announcement.id} />
              </article>
            ))}
          </section>
        )}

        <section className="sticky top-0 z-40 mb-8 rounded-3xl border border-white/10 bg-black/80 p-4 backdrop-blur-xl">
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
          <div className="flex flex-wrap gap-3">
          {filterTabs.map(([label, status]) => {
            const href = buildAdminHref(status, query);
            const active = activeStatus === status;

            return (
              <Link
                key={status}
                href={href}
                className={`rounded-2xl border px-5 py-3 text-sm font-black transition ${
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
        </section>

        <section className="grid gap-6">
          {applications.map((app) => {
            const style = statusStyles[app.status] ?? statusStyles.PENDING;
            const submittedAt = new Intl.DateTimeFormat("ar", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(app.createdAt);

            return (
              <article
                key={app.id}
                className={`rounded-3xl border p-6 ${style}`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-center gap-4">
                    {app.user.image ? (
                      <img
                        src={app.user.image}
                        className="h-16 w-16 rounded-full border border-white/20 object-cover"
                        alt={app.user.username}
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-black text-black">
                        {app.user.username[0]}
                      </div>
                    )}

                    <div>
                      <h2 className="text-3xl font-black text-white">{app.name}</h2>
                      <p className="mt-1 text-sm text-gray-300">Discord: {app.user.username}</p>
                      <p className="text-xs text-gray-500">ID: {app.user.discordId}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-current px-4 py-2 text-sm font-black">
                      {statusLabels[app.status] ?? app.status}
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
        </section>
      </div>
    </main>
  );
}

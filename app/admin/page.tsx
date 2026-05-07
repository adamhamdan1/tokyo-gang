import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminDecisionButtons } from "./AdminDecisionButtons";
import { AdminDiscordTestButton } from "./AdminDiscordTestButton";
import { AdminSyncButton } from "./AdminSyncButton";
import Link from "next/link";

const statusStyles: Record<string, string> = {
  PENDING: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.12)]",
  ACCEPTED: "border-green-400/40 bg-green-400/10 text-green-300 shadow-[0_0_24px_rgba(74,222,128,0.12)]",
  REJECTED: "border-red-500/40 bg-red-500/10 text-red-300 shadow-[0_0_24px_rgba(239,68,68,0.14)]",
  INTERVIEW: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300 shadow-[0_0_24px_rgba(250,204,21,0.12)]",
};

const statusLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  INTERVIEW: "مقابلة",
};

const filterTabs = [
  ["الكل", "ALL"],
  ["قيد المراجعة", "PENDING"],
  ["المقبولين", "ACCEPTED"],
  ["المرفوضين", "REJECTED"],
  ["المقابلات", "INTERVIEW"],
];

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
}) {
  const session = await auth();
  const adminIds = process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()) || [];
  const params = await searchParams;
  const activeStatus = ["PENDING", "ACCEPTED", "REJECTED", "INTERVIEW"].includes(params?.status ?? "")
    ? params?.status
    : "ALL";

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

  const [applications, memberCount, totalApplications, acceptedApplications, rejectedApplications] = await Promise.all([
    prisma.application.findMany({
      where: activeStatus === "ALL" ? undefined : { status: activeStatus },
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
  ]);

  const stats = [
    ["عدد الأعضاء", memberCount],
    ["عدد التقديمات", totalApplications],
    ["عدد المقبولين", acceptedApplications],
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

        <section className="mb-8 flex flex-wrap gap-3">
          {filterTabs.map(([label, status]) => {
            const href = status === "ALL" ? "/admin" : `/admin?status=${status}`;
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
              </Link>
            );
          })}
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

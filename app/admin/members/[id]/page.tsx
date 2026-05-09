import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminMemberActions } from "../../AdminMemberActions";
import { AdminWarningForm } from "../../AdminWarningForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

const memberStatusStyles: Record<string, string> = {
  ACTIVE: "border-green-400/30 bg-green-400/10 text-green-300",
  WARNED: "border-yellow-400/30 bg-yellow-400/10 text-yellow-300",
  FINAL_WARNING: "border-red-500/30 bg-red-500/10 text-red-300",
  SUMMONED: "border-cyan-400/30 bg-cyan-400/10 text-cyan-300",
  DISMISSED: "border-red-600/40 bg-red-600/10 text-red-300",
  SUSPENDED: "border-red-600/40 bg-red-600/10 text-red-300",
  ON_LEAVE: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  HIGH_RISK: "border-red-500/30 bg-red-500/10 text-red-300",
  BLACKLISTED: "border-red-700/40 bg-red-700/10 text-red-300",
};

const warningLabels: Record<string, string> = {
  NORMAL: "تحذير عادي",
  HIGH: "تحذير قوي",
  DISMISSAL: "فصل",
  FINAL: "تحذير نهائي",
};

function getAdminIds() {
  return process.env.ADMIN_DISCORD_IDS?.split(",").map((id) => id.trim()).filter(Boolean) || [];
}

export default async function AdminMemberPage({ params }: Props) {
  const session = await auth();
  const adminIds = getAdminIds();

  if (!session?.user?.id || !adminIds.includes(session.user.id)) {
    return (
      <main dir="rtl" className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/25 bg-red-500/10 p-8 text-center">
          <p className="text-sm font-black tracking-[5px] text-red-300">ACCESS DENIED</p>
          <h1 className="mt-3 text-4xl font-black">ممنوع الدخول</h1>
        </div>
      </main>
    );
  }

  const { id } = await params;
  const member = await prisma.tokyoMember.findUnique({
    where: { id },
    include: {
      warnings: {
        orderBy: { createdAt: "desc" },
      },
      summons: {
        orderBy: { createdAt: "desc" },
      },
      complaintsFiled: {
        orderBy: { createdAt: "desc" },
        include: { accused: true },
        take: 10,
      },
      complaintsAgainst: {
        orderBy: { createdAt: "desc" },
        include: { reporter: true },
        take: 10,
      },
      adminLogs: {
        orderBy: { createdAt: "desc" },
        take: 12,
      },
      rankChanges: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      leaveRequests: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      notes: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      blacklistEntries: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (!member) {
    return (
      <main dir="rtl" className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 p-8 text-center">
          <h1 className="text-4xl font-black">العضو غير موجود</h1>
          <Link href="/admin" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-black text-black">
            رجوع للإدارة
          </Link>
        </div>
      </main>
    );
  }

  const statusClass = memberStatusStyles[member.status] ?? memberStatusStyles.ACTIVE;

  return (
    <main dir="rtl" className="min-h-screen bg-black px-3 py-5 text-white sm:px-5 md:p-10">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="inline-block rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 text-sm font-black text-gray-300">
          الرجوع للوحة الإدارة
        </Link>

        <header className="my-6 rounded-2xl border border-white/10 bg-zinc-950 p-5 md:my-10 md:rounded-3xl md:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-3 md:gap-4">
              {member.image ? (
                <img src={member.image} alt={member.username} className="h-16 w-16 rounded-full border border-white/20 object-cover md:h-20 md:w-20" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl font-black text-black md:h-20 md:w-20 md:text-3xl">
                  {member.displayName[0]}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[4px] text-red-500 md:text-xs md:tracking-[5px]">TOKYO MEMBER PROFILE</p>
                <h1 className="mt-2 truncate text-3xl font-black md:text-5xl">{member.displayName}</h1>
                <p className="mt-2 break-all text-xs text-gray-400 md:text-sm">
                  @{member.username} - {member.discordId}
                </p>
              </div>
            </div>
            <div className={`w-fit rounded-2xl border px-5 py-3 text-sm font-black ${statusClass}`}>
              {member.status}
            </div>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-2 gap-3 md:mb-10 md:grid-cols-4 md:gap-4">
          {[
            ["التحذيرات", member.warnings.length],
            ["الاستدعاءات", member.summons.length],
            ["شكاوي عليه", member.complaintsAgainst.length],
            ["شكاوي رفعها", member.complaintsFiled.length],
            ["التقييم", member.behaviorScore],
            ["الرتبة", member.internalRank],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-zinc-950 p-4 md:rounded-3xl md:p-6">
              <p className="text-xs text-gray-400 md:text-sm">{label}</p>
              <p className="mt-3 text-2xl font-black md:text-4xl">{value}</p>
            </div>
          ))}
        </section>

        <div className="grid gap-5 md:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-6">
            <AdminWarningForm memberId={member.id} />
            <AdminMemberActions memberId={member.id} currentRank={member.internalRank} currentScore={member.behaviorScore} />
          </div>

          <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5 md:rounded-3xl md:p-6">
            <p className="text-xs font-black tracking-[5px] text-yellow-300">WARNINGS</p>
            <div className="mt-5 grid gap-3">
              {member.warnings.length === 0 && <p className="text-gray-500">لا يوجد تحذيرات.</p>}
              {member.warnings.map((warning) => (
                <article key={warning.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-black text-white">{warning.reason}</p>
                    <span className="rounded-full border border-yellow-400/30 px-3 py-1 text-xs font-black text-yellow-300">
                      {warningLabels[warning.severity] ?? warning.severity}
                    </span>
                  </div>
                  {warning.details && <p className="mt-2 text-sm text-gray-400">{warning.details}</p>}
                  <p className="mt-2 text-xs text-gray-600">{warning.createdAt.toLocaleString("ar")}</p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-5 grid gap-5 md:mt-6 md:gap-6 lg:grid-cols-3">
          <Panel title="الاستدعاءات">
            {member.summons.map((summon) => (
              <Item key={summon.id} title={summon.reason} meta={`${summon.status} - ${summon.createdAt.toLocaleString("ar")}`} />
            ))}
          </Panel>
          <Panel title="الشكاوي عليه">
            {member.complaintsAgainst.map((complaint) => (
              <Item key={complaint.id} title={complaint.reason} meta={`${complaint.status} - من ${complaint.reporter.displayName}`} />
            ))}
          </Panel>
          <Panel title="سجل الإدارة">
            {member.adminLogs.map((log) => (
              <Item key={log.id} title={log.title} meta={`${log.action} - ${log.createdAt.toLocaleString("ar")}`} />
            ))}
          </Panel>
        </section>

        <section className="mt-5 grid gap-5 md:mt-6 md:gap-6 lg:grid-cols-3">
          <Panel title="سجل الرتب">
            {member.rankChanges.map((change) => (
              <Item key={change.id} title={`${change.action}: ${change.rank}`} meta={`${change.reason ?? "بدون سبب"} - ${change.createdAt.toLocaleString("ar")}`} />
            ))}
          </Panel>
          <Panel title="الإجازات">
            {member.leaveRequests.map((leave) => (
              <Item key={leave.id} title={leave.reason} meta={`${leave.status} - ${leave.createdAt.toLocaleString("ar")}`} />
            ))}
          </Panel>
          <Panel title="الملاحظات الخاصة">
            {member.notes.map((note) => (
              <Item key={note.id} title={note.note} meta={note.createdAt.toLocaleString("ar")} />
            ))}
            {member.blacklistEntries.map((entry) => (
              <Item key={entry.id} title={`BLACKLIST: ${entry.reason}`} meta={entry.active ? "نشط" : "مغلق"} />
            ))}
          </Panel>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-zinc-950 p-5 md:rounded-3xl md:p-6">
      <p className="text-xs font-black tracking-[4px] text-cyan-300">{title}</p>
      <div className="mt-5 grid gap-3">{children}</div>
    </section>
  );
}

function Item({ title, meta }: { title: string; meta: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-black/40 p-4">
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-xs text-gray-500">{meta}</p>
    </article>
  );
}

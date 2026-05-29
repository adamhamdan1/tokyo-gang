import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
import Link from "next/link";
import { LeaveRequestForm } from "./LeaveRequestForm";

const leaveLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  APPROVED: "مقبولة",
  REJECTED: "مرفوضة",
  EXPIRED: "منتهية",
};

export default async function LeavePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return <Gate title="سجل دخول بالديسكورد أولاً" />;
  }

  await syncTokyoMembersSafely();

  const member = await prisma.tokyoMember.findUnique({
    where: { discordId: session.user.id },
    include: {
      leaveRequests: {
        orderBy: { createdAt: "desc" },
        take: 8,
      },
    },
  });

  if (!member?.inTokyoRole) {
    return <Gate title="طلبات الإجازة لأعضاء TOKYO فقط" />;
  }

  return (
    <main dir="rtl" className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:100%_6px,80px_80px] opacity-55" />
      <div className="relative mx-auto max-w-5xl">
        <Link href="/" className="rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 text-sm font-black text-gray-300">
          الرجوع للرئيسية
        </Link>
        <header className="my-10 border-b border-white/10 pb-8 text-center">
          <p className="text-sm font-black tracking-[6px] text-emerald-300">TOKYO LEAVE SYSTEM</p>
          <h1 className="mt-3 text-5xl font-black">نظام الإجازات</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-400">
            اطلب إجازتك بوضوح، الإدارة تراجعها، وإذا انقبلت تنعطى رتبة الإجازة تلقائياً لحد نهاية المدة.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <LeaveRequestForm />
          <section className="rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <p className="text-xs font-black tracking-[5px] text-gray-400">LEAVE HISTORY</p>
            <div className="mt-5 grid gap-3">
              {member.leaveRequests.length === 0 ? (
                <p className="rounded-2xl border border-white/10 bg-black/40 p-5 text-gray-500">لا يوجد طلبات إجازة بعد.</p>
              ) : (
                member.leaveRequests.map((leave) => (
                  <article key={leave.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-black text-white">{leaveLabels[leave.status] ?? leave.status}</p>
                      <span className="text-xs text-gray-500">{leave.createdAt.toLocaleString("ar")}</span>
                    </div>
                    <p className="mt-3 leading-7 text-gray-300">{leave.reason}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {leave.startsAt ? `تبدأ: ${leave.startsAt.toLocaleString("ar")}` : "تبدأ فور الموافقة"}
                      {leave.endsAt ? ` - تنتهي: ${leave.endsAt.toLocaleString("ar")}` : ""}
                    </p>
                    {leave.adminNote && <p className="mt-3 rounded-xl bg-white/5 p-3 text-xs text-gray-400">{leave.adminNote}</p>}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Gate({ title }: { title: string }) {
  return (
    <main dir="rtl" className="flex min-h-screen items-center justify-center bg-black p-8 text-white">
      <div className="rounded-3xl border border-red-500/25 bg-red-500/10 p-8 text-center">
        <p className="text-sm font-black tracking-[5px] text-red-300">RESTRICTED</p>
        <h1 className="mt-3 text-4xl font-black">{title}</h1>
        <Link href="/" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-black text-black">
          رجوع
        </Link>
      </div>
    </main>
  );
}

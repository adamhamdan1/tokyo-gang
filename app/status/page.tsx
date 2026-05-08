import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  PENDING: "قيد المراجعة",
  ACCEPTED: "مقبول",
  REJECTED: "مرفوض",
  INTERVIEW: "مقابلة",
  TRIAL: "فترة تجربة",
};

const statusClasses: Record<string, string> = {
  PENDING: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  ACCEPTED: "border-green-400/40 bg-green-400/10 text-green-300",
  REJECTED: "border-red-500/40 bg-red-500/10 text-red-300",
  INTERVIEW: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
  TRIAL: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300",
};

export default async function StatusPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main dir="rtl" className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 p-8 text-center">
          <h1 className="text-4xl font-black">سجل دخول أولاً</h1>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-black text-black">
            الرجوع للرئيسية
          </Link>
        </div>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { discordId: session.user.id },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const application = user?.applications[0];

  return (
    <main dir="rtl" className="min-h-screen bg-black p-8 text-white">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-8 inline-block rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 font-black text-gray-300">
          الرجوع للرئيسية
        </Link>

        <section className="rounded-3xl border border-white/15 bg-zinc-950 p-8 shadow-[0_0_50px_rgba(255,255,255,0.06)]">
          <p className="text-sm font-black tracking-[6px] text-red-500">TOKYO APPLICATION</p>
          <h1 className="mt-3 text-5xl font-black">حالة الطلب</h1>

          {!application ? (
            <p className="mt-8 text-gray-300">ما عندك أي طلب تقديم حالياً.</p>
          ) : (
            <div className="mt-8 space-y-5">
              <span className={`inline-block rounded-full border px-5 py-2 font-black ${statusClasses[application.status] ?? statusClasses.PENDING}`}>
                {statusLabels[application.status] ?? application.status}
              </span>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-gray-500">الاسم</p>
                  <p className="mt-2 font-bold">{application.name}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-gray-500">تاريخ التقديم</p>
                  <p className="mt-2 font-bold">{application.createdAt.toLocaleString("ar")}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-gray-500">المدينة</p>
                  <p className="mt-2 font-bold">{application.city ?? "غير محدد"}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <p className="text-xs text-gray-500">ساعات اللعب / المايك</p>
                  <p className="mt-2 font-bold">
                    {application.dailyHours ?? "غير محدد"} - {application.hasMic ? "معه مايك" : "بدون مايك"}
                  </p>
                </div>
              </div>

              {application.decisionReason && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
                  <p className="text-xs text-red-300">سبب الرفض</p>
                  <p className="mt-2 leading-8">{application.decisionReason}</p>
                </div>
              )}

              {application.interviewNote && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <p className="text-xs text-cyan-300">معلومات المقابلة</p>
                  <p className="mt-2 leading-8">
                    {application.interviewAt ? `${application.interviewAt.toLocaleString("ar")} - ` : ""}
                    {application.interviewNote}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

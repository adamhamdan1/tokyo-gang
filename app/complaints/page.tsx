import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
import Link from "next/link";
import { ComplaintForm } from "./ComplaintForm";

export default async function ComplaintsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main dir="rtl" className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 p-8 text-center">
          <h1 className="text-4xl font-black">نظام شكاوي TOKYO</h1>
          <p className="mt-4 text-gray-400">سجل دخول بالديسكورد أولاً.</p>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-black text-black">
            رجوع
          </Link>
        </div>
      </main>
    );
  }

  await syncTokyoMembersSafely();

  const reporter = await prisma.tokyoMember.findUnique({
    where: { discordId: session.user.id },
  });

  if (!reporter?.inTokyoRole) {
    return (
      <main dir="rtl" className="min-h-screen bg-black p-8 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/25 bg-red-500/10 p-8 text-center">
          <p className="text-sm font-black tracking-[5px] text-red-300">ACCESS DENIED</p>
          <h1 className="mt-3 text-4xl font-black">النظام مخصص لأعضاء TOKYO فقط</h1>
          <p className="mt-4 text-gray-400">إذا أخذت الرتبة الآن، انتظر أقل من دقيقة وجرب تحدث الصفحة.</p>
          <Link href="/" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-black text-black">
            رجوع
          </Link>
        </div>
      </main>
    );
  }

  const [members, myComplaints] = await Promise.all([
    prisma.tokyoMember.findMany({
      where: {
        inTokyoRole: true,
        id: { not: reporter.id },
      },
      orderBy: { displayName: "asc" },
      select: {
        id: true,
        displayName: true,
        username: true,
      },
    }),
    prisma.complaint.findMany({
      where: { reporterId: reporter.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { accused: true },
    }),
  ]);

  return (
    <main dir="rtl" className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="mx-auto max-w-6xl">
        <Link href="/" className="rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 text-sm font-black text-gray-300">
          الرجوع للرئيسية
        </Link>

        <header className="my-10 border-b border-white/10 pb-8 text-center">
          <p className="text-sm font-black tracking-[6px] text-red-500">TOKYO INTERNAL</p>
          <h1 className="mt-3 text-5xl font-black">نظام شكاوي الأعضاء</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-400">
            ارفع شكوى واضحة مع سبب وتفاصيل. رابط التصوير اختياري لكنه يساعد الإدارة تحسم القرار بسرعة.
          </p>
        </header>

        <ComplaintForm members={members} />

        {myComplaints.length > 0 && (
          <section className="mx-auto mt-10 max-w-3xl rounded-3xl border border-white/10 bg-zinc-950 p-6">
            <p className="text-xs font-black tracking-[5px] text-green-400">MY REPORTS</p>
            <div className="mt-5 grid gap-3">
              {myComplaints.map((complaint) => (
                <article key={complaint.id} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-black text-white">{complaint.accused.displayName}</p>
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-black text-gray-300">
                      {complaint.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-400">{complaint.reason}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

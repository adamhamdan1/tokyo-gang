import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { syncTokyoMembersSafely } from "@/lib/tokyo-member-sync";
import { TOKYO_RULES } from "@/lib/tokyo-content";
import Link from "next/link";

export default async function InternalRulesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <main dir="rtl" className="tokyo-dashboard min-h-screen p-5 text-white md:p-10">
        <Gate title="سجل دخول بالديسكورد أولاً" />
      </main>
    );
  }

  await syncTokyoMembersSafely();

  const member = await prisma.tokyoMember.findUnique({
    where: { discordId: session.user.id },
  });

  if (!member?.inTokyoRole) {
    return (
      <main dir="rtl" className="tokyo-dashboard min-h-screen p-5 text-white md:p-10">
        <Gate title="القوانين الداخلية لأعضاء TOKYO فقط" />
      </main>
    );
  }

  return (
    <main dir="rtl" className="tokyo-dashboard min-h-screen p-4 text-white md:p-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="rounded-2xl border border-white/15 bg-zinc-950 px-5 py-3 text-sm font-black text-gray-300">
          الرجوع للرئيسية
        </Link>
        <header className="tokyo-panel my-8 p-6 text-center md:my-10 md:p-8">
          <p className="text-sm font-black tracking-[6px] text-red-500">TOKYO INTERNAL</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">القوانين الداخلية</h1>
          <p className="mx-auto mt-4 max-w-2xl leading-8 text-gray-400">
            صفحة خاصة لأعضاء TOKYO، مرتبطة بعضويتك في الديسكورد وتحدث صلاحيتك تلقائياً.
          </p>
        </header>
        <section className="grid gap-4">
          {TOKYO_RULES.map((rule, index) => (
            <article key={rule} className="tokyo-panel p-6 transition duration-300 hover:-translate-y-0.5 hover:border-red-400/25">
              <p className="text-xs font-black tracking-[4px] text-cyan-300">RULE {String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-3 text-3xl font-black">قانون داخلي</h2>
              <p className="mt-3 leading-8 text-gray-400">{rule}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

function Gate({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/25 bg-red-500/10 p-8 text-center">
      <p className="text-sm font-black tracking-[5px] text-red-300">RESTRICTED</p>
      <h1 className="mt-3 text-4xl font-black">{title}</h1>
      <Link href="/" className="mt-6 inline-block rounded-2xl bg-white px-6 py-3 font-black text-black">
        رجوع
      </Link>
    </div>
  );
}

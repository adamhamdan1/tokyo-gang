"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { StreamerApplicationForm } from "../StreamerApplicationForm";

export default function StreamerApplyPage() {
  const session = useSession();

  return (
    <main dir="rtl" className="tokyo-dashboard relative min-h-screen overflow-hidden px-4 py-8 text-white sm:px-6 md:py-14">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_75%_15%,rgba(83,252,24,0.12),transparent_28%),radial-gradient(circle_at_15%_70%,rgba(239,68,68,0.12),transparent_30%)]" />
      <div className="relative mx-auto max-w-4xl">
        <Link href="/#streamers" className="inline-flex rounded-2xl border border-white/15 bg-black/50 px-5 py-3 text-sm font-black text-zinc-300 transition hover:border-white/30 hover:text-white">الرجوع للستريمرز</Link>

        <section className="mt-7 overflow-hidden rounded-[32px] border border-[#53fc18]/20 bg-zinc-950/90 shadow-[0_35px_120px_rgba(0,0,0,0.75),0_0_50px_rgba(83,252,24,0.06)]">
          <div className="border-b border-white/10 bg-[linear-gradient(120deg,rgba(83,252,24,0.12),transparent_45%,rgba(239,68,68,0.08))] p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#53fc18] px-4 py-2 text-[10px] font-black tracking-[2px] text-black">CREATOR RECRUITMENT</span>
              <span className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black tracking-[2px] text-zinc-400">TOKYO MEDIA DIVISION</span>
            </div>
            <h1 className="mt-6 text-4xl font-black sm:text-6xl">تقديم رتبة Streamer</h1>
            <p className="mt-4 max-w-2xl text-sm leading-8 text-zinc-400 sm:text-base">إذا عندك حضور، محتوى قوي، والتزام باسم TOKYO، أرسل ملفك لفريق الستريمرز. الطلب يروح مباشرة لمسؤول الستريمرز.</p>
          </div>

          <div className="p-5 sm:p-8">
            {session.status === "loading" ? (
              <p className="py-12 text-center font-black text-zinc-400">جاري التحقق من Discord...</p>
            ) : session.data?.user ? (
              <StreamerApplicationForm />
            ) : (
              <div className="rounded-3xl border border-red-400/20 bg-red-400/[0.06] p-7 text-center">
                <h2 className="text-2xl font-black">اربط حساب Discord أولاً</h2>
                <p className="mt-3 text-sm leading-7 text-zinc-400">لازم نعرف حسابك داخل سيرفر TOKYO حتى يوصل الطلب باسمك الصحيح.</p>
                <button type="button" onClick={() => signIn("discord", { redirectTo: "/streamer-apply" })} className="mt-6 w-full rounded-2xl bg-white px-6 py-4 font-black text-black transition hover:bg-[#53fc18]">دخول Discord والمتابعة</button>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

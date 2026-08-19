"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { MEMBER_NAVIGATION, PRIMARY_NAVIGATION } from "@/lib/site-navigation";

const mobileToneClasses = {
  green: "border-green-400/15 text-green-300",
  cyan: "border-cyan-400/15 text-cyan-300",
  emerald: "border-emerald-400/15 text-emerald-300",
  yellow: "border-yellow-400/15 text-yellow-300",
  red: "border-red-400/20 text-red-300",
} as const;

export function MobileMenu() {
  const session = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const user = session.data?.user;

  return (
    <div className="xl:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="tokyo-mobile-menu"
        aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] border border-white/15 bg-white/[0.045] text-white shadow-[inset_0_1px_rgba(255,255,255,0.06)]"
      >
        <span className="absolute inset-1 rounded-[12px] border border-red-400/10" />
        <span className="relative flex h-4 w-5 flex-col justify-between">
          <span className={`h-px w-full bg-current transition duration-300 ${open ? "translate-y-[7.5px] rotate-45" : ""}`} />
          <span className={`h-px bg-red-400 transition duration-300 ${open ? "opacity-0" : "mr-auto w-3.5"}`} />
          <span className={`h-px w-full bg-current transition duration-300 ${open ? "-translate-y-[7.5px] -rotate-45" : ""}`} />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.button
              type="button"
              aria-label="إغلاق القائمة"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-[76px] z-[98] cursor-default bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              id="tokyo-mobile-menu"
              initial={{ opacity: 0, y: -18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="tokyo-scrollbar fixed inset-x-3 top-[84px] z-[100] max-h-[calc(100svh-100px)] overflow-y-auto rounded-[28px] border border-white/10 bg-[#060606]/[0.98] p-3 shadow-[0_30px_100px_rgba(0,0,0,0.85),0_0_40px_rgba(239,68,68,0.1)] backdrop-blur-2xl sm:inset-x-5"
            >
              <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-l from-red-950/35 via-white/[0.025] to-black p-4">
                <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />
                {user ? (
                  <div className="flex items-center gap-3">
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
                      {user.image ? (
                        <Image src={user.image} alt={user.name ?? "Discord user"} width={48} height={48} sizes="48px" className="h-full w-full object-cover" />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-black">{user.name?.[0] ?? "T"}</span>
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] font-black tracking-[3px] text-emerald-400">IDENTITY VERIFIED</p>
                      <p dir="auto" className="mt-1.5 truncate text-left text-base font-black text-white">{user.name}</p>
                    </div>
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.9)]" />
                  </div>
                ) : (
                  <div>
                    <p className="text-[9px] font-black tracking-[3px] text-red-400">TOKYO ACCESS</p>
                    <p className="mt-2 text-sm font-bold text-zinc-300">سجّل دخولك للوصول إلى أنظمة الأعضاء.</p>
                  </div>
                )}
              </div>

              <div className="mt-4 px-1">
                <div className="mb-2 flex items-center justify-between px-2">
                  <p className="text-[9px] font-black tracking-[3px] text-zinc-500">MAIN NAVIGATION</p>
                  <span className="text-[9px] font-black text-red-400">01 — 07</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {PRIMARY_NAVIGATION.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex min-h-14 items-center justify-between rounded-2xl border border-white/[0.075] bg-white/[0.025] px-3 py-2 text-sm font-black text-zinc-200 transition active:scale-[0.98] active:bg-white/[0.07]"
                    >
                      <span>{item.label}</span>
                      <span className="text-[9px] text-red-400/60">{item.code}</span>
                    </a>
                  ))}
                </div>
              </div>

              {user && (
                <div className="mt-5 border-t border-white/[0.08] px-1 pt-4">
                  <p className="mb-2 px-2 text-[9px] font-black tracking-[3px] text-zinc-500">MEMBER SYSTEMS</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {MEMBER_NAVIGATION.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`flex min-h-14 items-center justify-between rounded-2xl border bg-white/[0.02] px-3 py-2 text-sm font-black transition active:scale-[0.98] ${mobileToneClasses[item.tone]}`}
                      >
                        <span>{item.label}</span>
                        <span className="text-[8px] tracking-[1px] opacity-50">{item.code}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => (user ? signOut() : signIn("discord"))}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] px-4 py-3.5 text-sm font-black transition active:scale-[0.99] ${user ? "border border-red-400/20 bg-red-400/[0.07] text-red-300" : "bg-red-500 text-white shadow-[0_0_28px_rgba(239,68,68,0.18)]"}`}
              >
                <span className={`h-2 w-2 rounded-full ${user ? "bg-red-400" : "bg-white shadow-[0_0_10px_white]"}`} />
                {user ? "تسجيل الخروج" : "الدخول بواسطة Discord"}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { MEMBER_NAVIGATION, PRIMARY_NAVIGATION } from "@/lib/site-navigation";
import { MobileMenu } from "./MobileMenu";

type SiteAlert = {
  id: string;
  title: string;
  message: string;
};

const memberToneClasses = {
  green: "border-green-400/15 text-green-300 hover:border-green-400/35 hover:bg-green-400/10",
  cyan: "border-cyan-400/15 text-cyan-300 hover:border-cyan-400/35 hover:bg-cyan-400/10",
  emerald: "border-emerald-400/15 text-emerald-300 hover:border-emerald-400/35 hover:bg-emerald-400/10",
  yellow: "border-yellow-400/15 text-yellow-300 hover:border-yellow-400/35 hover:bg-yellow-400/10",
  red: "border-red-400/20 text-red-300 hover:border-red-400/45 hover:bg-red-400/10",
} as const;

export function SiteHeader({ siteAlert }: { siteAlert: SiteAlert | null }) {
  const session = useSession();
  const [activeSection, setActiveSection] = useState("home");

  useEffect(() => {
    const sections = PRIMARY_NAVIGATION.map((item) => document.getElementById(item.id)).filter(
      (section): section is HTMLElement => Boolean(section)
    );

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSection = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleSection?.target.id) {
          setActiveSection(visibleSection.target.id);
        }
      },
      { rootMargin: "-18% 0px -70% 0px", threshold: [0, 0.01, 0.1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const user = session.data?.user;

  return (
    <nav className="tokyo-site-header fixed inset-x-0 top-0 z-[90]" aria-label="التنقل الرئيسي">
      <div className="tokyo-site-header-backdrop absolute inset-0" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/80 to-transparent" />
      <div className="tokyo-header-scan pointer-events-none absolute bottom-0 top-0 w-48" />

      <div dir="rtl" className="relative mx-auto flex h-[76px] max-w-[1680px] items-center justify-between gap-3 px-3 sm:px-5 2xl:px-8">
        <a href="#home" className="group flex min-w-0 items-center gap-3 xl:w-[220px] 2xl:w-[250px]" aria-label="TOKYO GANG الرئيسية">
          <span className="tokyo-brand-mark relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] border border-white/15 bg-white/[0.045]">
            <span className="absolute inset-[3px] rounded-[14px] border border-red-500/15" />
            <Image src="/tokyo-logo-clean.png" alt="" width={38} height={38} priority className="relative h-9 w-9 object-contain transition duration-500 group-hover:scale-110" />
            <span className="absolute -bottom-0.5 -left-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border-[3px] border-[#050505] bg-emerald-400 shadow-[0_0_14px_rgba(74,222,128,0.95)]">
              <span className="h-1 w-1 rounded-full bg-white" />
            </span>
          </span>
          <span className="min-w-0 leading-none">
            <span className="flex items-center gap-2 text-sm font-black tracking-[5px] text-white sm:text-base">
              TOKYO
              <span className="hidden h-px w-6 bg-gradient-to-l from-red-500 to-transparent sm:block" />
            </span>
            <span className="mt-2 block whitespace-nowrap text-[8px] font-black tracking-[3px] text-red-400 sm:text-[9px]">GANG COMMAND PORTAL</span>
          </span>
        </a>

        <div className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
          <div className="tokyo-nav-rail relative flex max-w-full items-center gap-0.5 rounded-[22px] border border-white/[0.09] bg-white/[0.025] p-1.5 shadow-[inset_0_1px_rgba(255,255,255,0.035)]">
            {PRIMARY_NAVIGATION.map((item) => {
              const active = activeSection === item.id;

              return (
                <a
                  key={item.id}
                  href={item.href}
                  data-active={active}
                  aria-current={active ? "location" : undefined}
                  onClick={() => setActiveSection(item.id)}
                  className="tokyo-nav-link group/link relative flex h-10 items-center gap-1.5 rounded-2xl px-2.5 text-[13px] font-black text-zinc-400 transition duration-300 hover:bg-white/[0.055] hover:text-white 2xl:px-3.5 2xl:text-sm"
                >
                  <span className="text-[8px] font-black tracking-[1px] text-white/20 transition group-hover/link:text-red-400/70 2xl:text-[9px]">{item.code}</span>
                  <span className="whitespace-nowrap">{item.label}</span>
                </a>
              );
            })}

            {user && (
              <details className="tokyo-nav-details group/internal relative">
                <summary className="flex h-10 cursor-pointer list-none items-center gap-2 rounded-2xl border border-red-400/15 bg-red-400/[0.065] px-3 text-[13px] font-black text-red-300 transition hover:border-red-400/30 hover:bg-red-400/10 2xl:px-4 2xl:text-sm">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_9px_rgba(248,113,113,0.85)]" />
                  <span className="whitespace-nowrap">الأنظمة</span>
                  <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 transition duration-300 group-open/internal:rotate-180">
                    <path d="m5 7.5 5 5 5-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                  </svg>
                </summary>

                <div className="absolute left-0 top-[calc(100%+16px)] w-[390px] overflow-hidden rounded-[24px] border border-white/10 bg-[#070707]/[0.98] p-3 shadow-[0_28px_90px_rgba(0,0,0,0.8),0_0_35px_rgba(239,68,68,0.1)] backdrop-blur-2xl">
                  <div className="mb-3 flex items-center justify-between border-b border-white/10 px-2 pb-3">
                    <div>
                      <p className="text-[10px] font-black tracking-[3px] text-red-400">MEMBER SYSTEMS</p>
                      <p className="mt-1 text-xs text-zinc-500">وصولك الآمن لأنظمة العصابة</p>
                    </div>
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black tracking-[2px] text-emerald-300">VERIFIED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {MEMBER_NAVIGATION.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group/route flex min-h-16 items-center justify-between gap-3 rounded-2xl border bg-white/[0.018] px-3 py-2.5 transition duration-300 ${memberToneClasses[item.tone]}`}
                      >
                        <span className="text-sm font-black">{item.label}</span>
                        <span className="text-[8px] font-black tracking-[1px] opacity-45 transition group-hover/route:opacity-90">{item.code}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="hidden shrink-0 items-center justify-end xl:flex xl:w-[220px] 2xl:w-[250px]">
          {user ? (
            <div className="tokyo-user-chip flex w-full min-w-0 items-center gap-2 rounded-[20px] border border-white/10 bg-white/[0.035] p-1.5 pr-2 shadow-[inset_0_1px_rgba(255,255,255,0.035)]">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-[14px] border border-white/15 bg-white/5">
                {user.image ? (
                  <Image src={user.image} width={40} height={40} sizes="40px" className="h-full w-full object-cover" alt={user.name ?? "Discord user"} />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-sm font-black text-white">{user.name?.[0] ?? "T"}</span>
                )}
              </span>
              <span className="min-w-0 flex-1 leading-none">
                <span className="block text-[8px] font-black tracking-[2px] text-emerald-400">DISCORD LINKED</span>
                <span dir="auto" className="mt-1.5 block truncate text-left text-[13px] font-black text-white">{user.name}</span>
              </span>
              <button
                type="button"
                onClick={() => signOut()}
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
                className="group/logout flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-400/15 text-zinc-500 transition hover:border-red-400/35 hover:bg-red-400/10 hover:text-red-300"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4.5 w-4.5 transition group-hover/logout:translate-x-0.5">
                  <path d="M10 5H6.8A1.8 1.8 0 0 0 5 6.8v10.4A1.8 1.8 0 0 0 6.8 19H10M14.5 8l4 4-4 4M9 12h9" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signIn("discord")}
              className="group flex w-full items-center justify-center gap-3 rounded-[18px] border border-red-400/25 bg-red-500 px-5 py-3 text-sm font-black text-white shadow-[0_0_28px_rgba(239,68,68,0.18)] transition hover:-translate-y-0.5 hover:bg-red-400"
            >
              <span className="h-2 w-2 rounded-full bg-white shadow-[0_0_10px_white]" />
              دخول Discord
            </button>
          )}
        </div>

        <MobileMenu />
      </div>

      {siteAlert && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative border-t border-white/[0.055] bg-black/80 px-3 pb-3 backdrop-blur-xl"
        >
          <div className="mx-auto flex max-w-5xl items-center gap-3 overflow-hidden rounded-b-[22px] border border-t-0 border-red-400/20 bg-gradient-to-l from-red-950/70 via-[#100607] to-black/90 px-3 py-2.5 shadow-[0_18px_45px_rgba(0,0,0,0.45),0_0_30px_rgba(239,68,68,0.09)] sm:px-4">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-300/25 bg-red-400/10 text-sm font-black text-red-200">
              !
              <span className="absolute inset-0 animate-ping rounded-xl border border-red-400/20" />
            </span>
            <span className="min-w-0 flex-1 text-right">
              <span className="block truncate text-[10px] font-black tracking-[2px] text-red-300 sm:text-xs">{siteAlert.title}</span>
              <span className="mt-1 block truncate text-xs font-bold text-zinc-200 sm:text-sm">{siteAlert.message}</span>
            </span>
            <span className="hidden rounded-full border border-red-300/15 bg-red-300/[0.065] px-3 py-1.5 text-[8px] font-black tracking-[2px] text-red-200 sm:block">LIVE NOTICE</span>
          </div>
        </motion.div>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent shadow-[0_0_14px_rgba(239,68,68,0.55)]" />
    </nav>
  );
}

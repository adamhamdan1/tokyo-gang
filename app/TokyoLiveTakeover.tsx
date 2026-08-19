"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { StreamerProfile } from "@/lib/site-content";

export type TokyoLiveStatus = {
  slug: string;
  isLive: boolean;
  title: string;
  viewers: number;
  thumbnail: string;
  startedAt: string | null;
};

function viewerLabel(viewers: number) {
  return new Intl.NumberFormat("ar-JO").format(Math.max(0, viewers));
}

export function TokyoLiveTakeover({
  streamer,
  status,
}: {
  streamer: StreamerProfile;
  status: TokyoLiveStatus;
}) {
  return (
    <motion.section
      id="live-now"
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: "easeOut" }}
      className="relative overflow-hidden border-y border-red-500/30 bg-[#050505] px-4 py-7 sm:px-6 md:py-10"
      aria-label={`${streamer.name} مباشر الآن على Kick`}
    >
      <div className="absolute inset-0">
        {status.thumbnail ? (
          <Image
            src={status.thumbnail}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-30 blur-[2px] scale-105"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.97)_0%,rgba(0,0,0,0.7)_48%,rgba(0,0,0,0.92)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_35%,rgba(239,68,68,0.24),transparent_32%),radial-gradient(circle_at_15%_80%,rgba(83,252,24,0.14),transparent_28%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 opacity-20 bg-[linear-gradient(to_bottom,transparent_49%,rgba(255,255,255,0.1)_50%,transparent_51%)] bg-[length:100%_5px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-7 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col items-center gap-5 text-center sm:flex-row sm:text-right">
          <div className="relative shrink-0">
            <span className="absolute -inset-2 animate-pulse rounded-[30px] border border-red-500/45 shadow-[0_0_38px_rgba(239,68,68,0.5)]" />
            <span className="relative block h-24 w-24 overflow-hidden rounded-[26px] border border-white/20 bg-black sm:h-28 sm:w-28">
              <Image src={streamer.logo} alt={streamer.name} fill sizes="112px" className="object-cover" />
            </span>
            <span className="absolute -bottom-2 -left-2 flex items-center gap-1.5 rounded-full border-2 border-black bg-red-500 px-3 py-1.5 text-[10px] font-black tracking-[1px] text-white shadow-[0_0_22px_rgba(239,68,68,0.7)]">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" /> LIVE
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="rounded-full border border-red-400/35 bg-red-500/15 px-3 py-1.5 text-[10px] font-black tracking-[3px] text-red-300">LIVE TAKEOVER</span>
              <span className="rounded-full border border-[#53fc18]/25 bg-[#53fc18]/10 px-3 py-1.5 text-[10px] font-black tracking-[2px] text-[#7aff4d]">KICK PARTNER</span>
            </div>
            <h2 className="mt-4 truncate text-3xl font-black text-white sm:text-4xl md:text-5xl">{streamer.name} مباشر الآن</h2>
            <p className="mt-3 line-clamp-2 max-w-3xl text-sm font-bold leading-7 text-zinc-300 sm:text-base">{status.title || "بث TOKYO مباشر الآن على Kick"}</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs font-black sm:justify-start">
              <span className="rounded-full border border-white/10 bg-black/55 px-3 py-2 text-zinc-200">
                <span className="text-red-400">●</span> {viewerLabel(status.viewers)} مشاهد
              </span>
              <span className="rounded-full border border-white/10 bg-black/55 px-3 py-2 text-zinc-400">TOKYO CREATOR ONLINE</span>
            </div>
          </div>
        </div>

        <a
          href={streamer.kick}
          target="_blank"
          rel="noreferrer"
          className="group relative mx-auto flex w-full max-w-sm items-center justify-center gap-3 overflow-hidden rounded-[22px] bg-[#53fc18] px-8 py-5 text-base font-black text-black shadow-[0_0_45px_rgba(83,252,24,0.24)] transition hover:-translate-y-1 hover:bg-white lg:w-auto"
        >
          <span className="absolute inset-y-0 -left-14 w-10 rotate-12 bg-white/70 blur-lg transition duration-700 group-hover:left-[115%]" />
          <span aria-hidden="true" className="relative text-2xl font-black leading-none tracking-[-0.18em] transition group-hover:scale-110">K</span>
          <span className="relative">شاهد البث الآن</span>
        </a>
      </div>
    </motion.section>
  );
}

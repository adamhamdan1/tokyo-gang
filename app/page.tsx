"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { ApplicationForm } from "./ApplicationForm";
import { AnnouncementsFeed } from "./AnnouncementsFeed";
import { MobileMenu } from "./MobileMenu";
import { TOKYO_RULES } from "@/lib/tokyo-content";

const killfeed = [
  "TOKYO secured North Side",
  "Target neutralized",
  "Territory updated",
  "High command online",
  "Recruit file encrypted",
];

const timeline = [
  ["مرحلة التأسيس", "بداية TOKYO GANG وبناء القيادة الأساسية."],
  ["أول سيطرة", "فرض الحضور داخل المدينة وإثبات الاسم."],
  ["توسّع النفوذ", "تنظيم الأعضاء وتقوية الملفات الداخلية."],
  ["نظام الإدارة", "تحويل العصابة لمنظومة تقديمات ورتب ومتابعة."],
];

const loadingSteps = [
  "CONNECTING DISCORD ACCOUNT",
  "VERIFYING TOKYO CLEARANCE",
  "SYNCING ACTIVE MEMBERS",
  "ARMING ADMIN CONSOLE",
];

type SiteAlert = {
  id: string;
  title: string;
  message: string;
};

const discordInviteUrl = "https://discord.gg/xTxcswpzNN";

function RevealSection({
  id,
  className,
  children,
}: {
  id?: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 42, filter: "blur(10px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.75, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function CountUpValue({ value }: { value: string | number }) {
  const numeric = typeof value === "number" ? value : Number(value);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(numeric)) {
      return;
    }

    let frame = 0;
    const totalFrames = 42;
    const timer = window.setInterval(() => {
      frame += 1;
      const progress = 1 - Math.pow(1 - frame / totalFrames, 3);
      setDisplay(Math.round(numeric * progress));

      if (frame >= totalFrames) {
        window.clearInterval(timer);
        setDisplay(numeric);
      }
    }, 22);

    return () => window.clearInterval(timer);
  }, [numeric]);

  if (!Number.isFinite(numeric)) {
    return <>{value}</>;
  }

  return <>{display}</>;
}

function GlitchTitle({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`tokyo-glitch relative inline-block ${className}`} data-text={children}>
      {children}
    </span>
  );
}

function AmbientParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[2] hidden overflow-hidden opacity-20 xl:block">
      {Array.from({ length: 5 }).map((_, index) => (
        <motion.span
          key={index}
          animate={{
            y: [0, -42 - index * 3, 0],
            opacity: [0.06, 0.2, 0.06],
          }}
          transition={{
            duration: 10 + (index % 4),
            repeat: Infinity,
            delay: index * 0.35,
            ease: "easeInOut",
          }}
          className="absolute h-1 w-1 rounded-full bg-white shadow-[0_0_14px_rgba(255,255,255,0.9)]"
          style={{
            left: `${(index * 17) % 100}%`,
            top: `${12 + ((index * 23) % 80)}%`,
          }}
        />
      ))}
    </div>
  );
}

export default function Home() {
  const session = useSession();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(40);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [roleMemberCount, setRoleMemberCount] = useState<number | null>(null);
  const [lastDiscordSync, setLastDiscordSync] = useState<Date | null>(null);
  const [siteAlert, setSiteAlert] = useState<SiteAlert | null>(null);
  const [loadHeroVideo, setLoadHeroVideo] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), performanceMode ? 1400 : 3000);
    return () => clearTimeout(timer);
  }, [performanceMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const connection = navigator as Navigator & {
        connection?: {
          saveData?: boolean;
        };
        hardwareConcurrency?: number;
      };
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const lowCoreDevice = typeof connection.hardwareConcurrency === "number" && connection.hardwareConcurrency <= 4;
      setPerformanceMode(Boolean(connection.connection?.saveData || prefersReducedMotion || lowCoreDevice || window.innerWidth < 768));
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (performanceMode || loading || !window.matchMedia("(min-width: 768px)").matches) {
      return;
    }

    const connection = navigator as Navigator & {
      connection?: {
        saveData?: boolean;
      };
    };

    if (connection.connection?.saveData) {
      return;
    }

    const timer = window.setTimeout(() => setLoadHeroVideo(true), 1200);
    return () => window.clearTimeout(timer);
  }, [loading, performanceMode]);

  useEffect(() => {
    const updateBackToTop = () => {
      setShowBackToTop(window.scrollY > 500);
    };

    updateBackToTop();
    window.addEventListener("scroll", updateBackToTop);
    return () => window.removeEventListener("scroll", updateBackToTop);
  }, []);

  useEffect(() => {
    const startMusic = async () => {
      if (!audioRef.current) return;

      audioRef.current.volume = volume / 100;

      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch {
        console.log("Autoplay blocked by browser");
      }
    };

    window.addEventListener("mousemove", startMusic, { once: true });
    window.addEventListener("click", startMusic, { once: true });

    return () => {
      window.removeEventListener("mousemove", startMusic);
      window.removeEventListener("click", startMusic);
    };
  }, [volume]);

  useEffect(() => {
    let active = true;

    const loadDiscordMembers = async () => {
      const response = await fetch("/api/discord-members", {
        cache: "default",
      });
      const data = (await response.json().catch(() => null)) as {
        onlineCount?: number | null;
        roleMemberCount?: number | null;
      } | null;

      if (!active || !response.ok) return;

      setOnlineCount(data?.onlineCount ?? null);
      setRoleMemberCount(data?.roleMemberCount ?? null);
      setLastDiscordSync(new Date());
    };

    const loadWhenVisible = () => {
      if (document.visibilityState === "visible") void loadDiscordMembers();
    };

    loadWhenVisible();
    const interval = window.setInterval(loadWhenVisible, 60_000);
    document.addEventListener("visibilitychange", loadWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", loadWhenVisible);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadAlert = async () => {
      const response = await fetch(`/api/alerts?t=${Date.now()}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { alert?: SiteAlert | null } | null;
      if (active) setSiteAlert(data?.alert ?? null);
    };

    const loadWhenVisible = () => {
      if (document.visibilityState === "visible") void loadAlert();
    };

    loadWhenVisible();
    const interval = window.setInterval(loadWhenVisible, 60_000);
    document.addEventListener("visibilitychange", loadWhenVisible);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", loadWhenVisible);
    };
  }, []);

  const toggleMusic = () => {
    if (!audioRef.current) return;

    audioRef.current.volume = volume / 100;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const changeVolume = (value: number) => {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
  };

  return (
    <main dir="rtl" data-performance={performanceMode ? "lite" : "full"} className="min-h-screen overflow-hidden bg-black text-white">
      {!performanceMode && <AmbientParticles />}

      <div className="pointer-events-none fixed inset-0 z-[9997] opacity-[0.035] bg-[linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[length:100%_4px]" />
      <div className="pointer-events-none fixed inset-0 z-[9996] bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
      <div
        className="pointer-events-none fixed inset-0 z-[1] opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 24%, rgba(239,68,68,0.14), transparent 28%), radial-gradient(circle at 78% 18%, rgba(255,255,255,0.08), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 100% 100%, 96px 96px",
        }}
      />

      <audio ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mpeg" />
      </audio>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[999] overflow-hidden bg-black text-white"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_31%),radial-gradient(circle_at_50%_62%,rgba(239,68,68,0.16),transparent_26%),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:100%_100%,100%_100%,72px_72px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0,transparent_48%,rgba(255,255,255,0.10)_50%,transparent_52%,transparent_100%)] bg-[length:100%_8px] opacity-30" />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-0 top-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            />
            <div className="absolute left-6 top-6 h-16 w-16 border-l border-t border-white/30" />
            <div className="absolute right-6 top-6 h-16 w-16 border-r border-t border-white/30" />
            <div className="absolute bottom-6 left-6 h-16 w-16 border-b border-l border-white/30" />
            <div className="absolute bottom-6 right-6 h-16 w-16 border-b border-r border-white/30" />
            <div className="absolute inset-x-6 top-7 flex items-center justify-between text-[10px] font-black tracking-[4px] text-white/55 md:text-xs">
              <span>TOKYO GANG</span>
              <span>ACCESS GRANTED</span>
            </div>
            <div className="absolute inset-x-6 bottom-7 flex items-center justify-between text-[10px] font-black tracking-[4px] text-white/55 md:text-xs">
              <span>SERVER: TOKYO GANG</span>
              <span>STATUS: ONLINE</span>
            </div>

            <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-20 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.86, y: 18 }}
                animate={{ opacity: 1, scale: [1, 1.015, 1], y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="relative flex h-44 w-44 items-center justify-center md:h-60 md:w-60"
              >
                <motion.div
                  animate={{ scale: [0.82, 1.2, 0.82], opacity: [0.1, 0.35, 0.1] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-1 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.34),transparent_62%)] blur-2xl"
                />
                <motion.div
                  animate={{ rotate: 360, opacity: [0.12, 0.34, 0.12] }}
                  transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, opacity: { duration: 1.8, repeat: Infinity } }}
                  className="absolute inset-7 rounded-full border border-white/20 border-t-white/65"
                />
                <motion.div
                  animate={{ rotate: -360, opacity: [0.18, 0.45, 0.18] }}
                  transition={{ rotate: { duration: 12, repeat: Infinity, ease: "linear" }, opacity: { duration: 2.2, repeat: Infinity } }}
                  className="absolute inset-11 rounded-full border border-dashed border-red-500/35"
                />
                <motion.div
                  animate={{ x: ["-70%", "70%"], opacity: [0, 0.55, 0] }}
                  transition={{ duration: 1.7, repeat: Infinity, repeatDelay: 0.75, ease: "easeInOut" }}
                  className="absolute inset-8 rounded-full bg-gradient-to-r from-transparent via-white/35 to-transparent blur-sm [mask-image:radial-gradient(circle_at_center,black_0%,black_58%,transparent_76%)] [-webkit-mask-image:radial-gradient(circle_at_center,black_0%,black_58%,transparent_76%)]"
                />
                <motion.img
                  src="/tokyo-logo-clean.png"
                  alt=""
                  aria-hidden="true"
                  animate={{ x: [-1, 2, -2, 0], opacity: [0, 0.22, 0, 0] }}
                  transition={{ duration: 0.24, repeat: Infinity, repeatDelay: 2.1 }}
                  className="absolute z-10 h-36 w-36 object-contain [mask-image:radial-gradient(circle_at_center,black_0%,black_48%,transparent_76%)] [-webkit-mask-image:radial-gradient(circle_at_center,black_0%,black_48%,transparent_76%)] opacity-0 drop-shadow-[0_0_18px_rgba(239,68,68,0.8)] md:h-48 md:w-48"
                />
                <motion.img
                  src="/tokyo-logo-clean.png"
                  alt="TOKYO GANG"
                  loading="eager"
                  initial={{ opacity: 0, filter: "blur(12px)" }}
                  animate={{
                    opacity: 1,
                    scale: [1, 1.035, 1],
                    rotate: [0, -0.4, 0.35, 0],
                    filter: ["blur(0px) brightness(1)", "blur(0px) brightness(1.22)", "blur(0px) brightness(1)"],
                  }}
                  transition={{
                    opacity: { delay: 0.16, duration: 0.72 },
                    scale: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 3.6, repeat: Infinity, ease: "easeInOut" },
                    filter: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
                  }}
                  className="relative z-10 h-36 w-36 object-contain [mask-image:radial-gradient(circle_at_center,black_0%,black_48%,transparent_76%)] [-webkit-mask-image:radial-gradient(circle_at_center,black_0%,black_48%,transparent_76%)] drop-shadow-[0_0_38px_rgba(255,255,255,0.72)] md:h-48 md:w-48"
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.34 }}
                className="mt-7 text-[10px] font-black tracking-[6px] text-red-500 drop-shadow-[0_0_16px_rgba(239,68,68,0.9)] md:text-xs"
              >
                OFFICIAL TOKYO GANG PORTAL
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 26, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.48, duration: 0.65 }}
                className="mt-4 text-4xl font-black tracking-[7px] drop-shadow-[0_0_42px_rgba(255,255,255,0.95)] md:text-8xl"
              >
                TOKYO GANG
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.72 }}
                className="mt-6 w-full max-w-xl"
              >
                <div className="mb-3 flex items-center justify-between text-[10px] font-black tracking-[4px] text-white/55 md:text-xs">
                  <span>LOADING EXPERIENCE</span>
                  <motion.span
                    animate={{ opacity: [0.45, 1, 0.45] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  >
                    100%
                  </motion.span>
                </div>
                <div className="h-1.5 overflow-hidden bg-white/10">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2.65, ease: "easeInOut" }}
                    className="h-full bg-gradient-to-r from-red-600 via-white to-red-600 shadow-[0_0_25px_rgba(239,68,68,0.65)]"
                  />
                </div>
              </motion.div>

              <div className="mt-8 grid w-full max-w-2xl gap-2 text-left text-[10px] font-mono uppercase tracking-[2px] text-white/60 md:grid-cols-4 md:text-[11px]">
                {loadingSteps.map((step, index) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.82 + index * 0.18 }}
                    className="border-t border-white/20 px-1 py-3"
                  >
                    <span className="mr-2 text-red-500">0{index + 1}</span>
                    {step}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed left-0 right-0 top-0 z-[90] overflow-hidden border-b border-white/10 bg-black/75 shadow-[0_18px_60px_rgba(0,0,0,0.35)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-red-500/70 to-transparent" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-3 md:px-6">
          <a href="#home" className="group flex items-center gap-3" aria-label="TOKYO GANG الرئيسية">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] shadow-[0_0_24px_rgba(239,68,68,0.12)]">
              <Image src="/tokyo-logo-clean.png" alt="" width={32} height={32} className="h-8 w-8 object-contain" />
              <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 rounded-full border-2 border-black bg-green-400 shadow-[0_0_10px_lime]" />
            </span>
            <span>
              <span className="block text-sm font-black tracking-[4px] text-white">TOKYO</span>
              <span className="block text-[9px] font-black tracking-[3px] text-red-400">GANG PORTAL</span>
            </span>
          </a>
          <MobileMenu />
          <div className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.035] p-1 text-xs font-bold text-gray-400 md:flex lg:text-sm">
            <a href="#home" className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-white">الرئيسية</a>
            <a href="#command" className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-white">القيادة</a>
            <a href="#streamers" className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-white">الستريمرز</a>
            <a href="#rules" className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-white">القوانين</a>
            <a href="#wars" className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-white">الحروب</a>
            <a href="#apply" className="rounded-xl px-3 py-2 transition hover:bg-white/10 hover:text-white">التقديم</a>
            {session.data?.user && (
              <>
                <a href="/status" className="text-green-400 hover:text-green-300">طلبي</a>
                <a href="/complaints" className="text-cyan-300 hover:text-cyan-200">الشكاوي</a>
                <a href="/leave" className="text-emerald-300 hover:text-emerald-200">الإجازات</a>
                <a href="/rules-internal" className="text-yellow-300 hover:text-yellow-200">القوانين الداخلية</a>
                <a href="/admin" className="text-red-400 hover:text-red-300">الإدارة</a>
              </>
            )}
          </div>
          {session.data?.user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/50 px-3 py-2 shadow-[0_0_20px_rgba(255,255,255,0.08)]">
                {session.data.user.image && (
                  <Image
                    src={session.data.user.image}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border border-white/20 object-cover"
                    alt={session.data.user.name ?? "Discord user"}
                  />
                )}
                <p className="hidden max-w-28 truncate text-sm font-bold text-white sm:block">
                  {session.data.user.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => signOut()}
                className="rounded-full border border-white/15 bg-black/50 px-4 py-2 text-sm font-bold text-gray-300 transition hover:text-white"
              >
                خروج
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => signIn("discord")}
              className="rounded-xl border border-red-400/30 bg-red-500 px-5 py-2.5 text-sm font-black text-white shadow-[0_0_28px_rgba(239,68,68,0.22)] transition hover:-translate-y-0.5 hover:bg-red-400"
            >
              Discord
            </button>
          )}
        </div>
        {siteAlert && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-red-500/30 bg-red-950/85 px-4 py-2 text-center text-white shadow-[0_0_35px_rgba(239,68,68,0.18)]"
          >
            <p className="text-[10px] font-black tracking-[4px] text-red-200 md:text-xs">{siteAlert.title}</p>
            <p className="mx-auto mt-1 max-w-5xl overflow-hidden text-ellipsis whitespace-nowrap text-xs font-bold md:text-sm">
              {siteAlert.message}
            </p>
          </motion.div>
        )}
      </nav>

      <div className="group fixed bottom-4 left-4 z-50 flex items-center gap-3 rounded-full border border-white/15 bg-black/70 p-2 backdrop-blur-md shadow-[0_0_28px_rgba(255,255,255,0.08)] transition hover:rounded-2xl md:bottom-6 md:left-6 md:p-3">
        <button
          type="button"
          onClick={toggleMusic}
          aria-label={playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-black text-black transition hover:bg-gray-300 md:h-12 md:w-12 md:text-xl"
        >
          {playing ? "Ⅱ" : "▶"}
        </button>

        <div className="grid w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover:w-44 group-hover:opacity-100">
          <p className="mb-2 text-xs font-bold text-gray-400">الصوت {volume}%</p>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {session.data?.user && (
        <motion.a
          href="/admin"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.04, x: -4 }}
          className="fixed right-6 top-1/2 z-50 hidden -translate-y-1/2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-black tracking-[3px] text-red-300 shadow-[0_0_24px_rgba(239,68,68,0.18)] backdrop-blur-md lg:block"
        >
          ADMIN CONSOLE
        </motion.a>
      )}

      <div
        tabIndex={0}
        aria-label="TOKYO NETWORK — مرر المؤشر لعرض الحالة"
        className={`group fixed right-4 z-40 hidden w-14 overflow-hidden rounded-2xl border border-green-400/20 bg-black/80 p-4 text-left shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-[width,border-color,box-shadow] duration-500 hover:w-72 hover:border-green-400/40 hover:shadow-[0_20px_70px_rgba(0,0,0,0.7),0_0_24px_rgba(74,222,128,0.1)] focus:w-72 focus:border-green-400/40 focus:outline-none xl:block ${siteAlert ? "top-40" : "top-24"}`}
      >
        <span className="absolute right-[1.15rem] top-[1.15rem] h-2.5 w-2.5 animate-pulse rounded-full bg-green-400 shadow-[0_0_14px_lime]" />
        <div className="w-56 translate-x-6 opacity-0 transition duration-500 group-hover:translate-x-0 group-hover:opacity-100 group-focus:translate-x-0 group-focus:opacity-100">
          <p className="mb-3 whitespace-nowrap text-xs font-black tracking-[3px] text-green-400">TOKYO NETWORK</p>
          <p className="text-sm text-gray-300">SERVER: TOKYO GANG</p>
          <p className="text-sm text-gray-300">BOT: LINKED</p>
          <p className="flex items-center gap-2 text-sm text-gray-300">
            <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_lime]" />
            ONLINE SERVER: {onlineCount ?? "SYNCING"}
          </p>
          <p className="text-sm text-gray-300">ROLE MEMBERS: {roleMemberCount ?? "SYNCING"}</p>
          <p className="text-xs text-green-400/70">
            LAST SYNC: {lastDiscordSync ? lastDiscordSync.toLocaleTimeString("en-GB") : "WAITING"}
          </p>
          <div className="mt-4 space-y-2 text-xs text-gray-400">
            {killfeed.slice(0, 3).map((item) => (
              <p key={item} className="border-t border-white/10 pt-2">{item}</p>
            ))}
          </div>
        </div>
      </div>

      <section id="home" className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 text-center md:h-screen md:px-6">
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-35 grayscale md:opacity-15" />
        <motion.div
          initial={{ opacity: 0, scale: 1.8 }}
          animate={{ opacity: loading ? 0 : [0.85, 0], scale: loading ? 1.8 : [1.8, 1] }}
          transition={{ delay: 0.05, duration: 1.2, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),rgba(255,255,255,0.12)_18%,transparent_42%)]"
        />

        <div className="absolute inset-0 hidden overflow-hidden xl:block">
          {!performanceMode && loadHeroVideo && (
            <video autoPlay muted loop playsInline preload="none" className="h-full w-full scale-105 object-cover opacity-45 grayscale">
              <source src="/bg.mp4" type="video/mp4" />
            </video>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_46%,rgba(255,255,255,0.08)_50%,transparent_54%,transparent_100%)] opacity-45" />

        <div className="absolute -bottom-20 left-0 hidden h-[240px] w-[560px] rounded-full bg-white/[0.06] blur-3xl xl:block" />

        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 120, rotateX: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="relative z-10"
        >
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "260px", opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2 }}
            className="mx-auto mb-6 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"
          />

          <motion.p
            initial={{ opacity: 0, y: 25, letterSpacing: "0px" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "3px" }}
            transition={{ delay: 0.7, duration: 1 }}
            className="mb-5 text-sm text-gray-300 drop-shadow-[0_0_10px_white]"
          >
            نَحْنُ لا نَستَسلِم نَنْتَصِر او نَمْوتْ
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, scale: 1.4, filter: "blur(14px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", x: [0, -2, 2, 0] }}
            transition={{
              opacity: { duration: 1 },
              scale: { duration: 1.3 },
              filter: { duration: 1.1 },
              x: { duration: 0.25, repeat: Infinity, repeatDelay: 3 },
            }}
            className="relative text-6xl font-black tracking-[4px] text-white drop-shadow-[0_0_40px_white] sm:text-7xl md:text-9xl md:tracking-[10px]"
          >
            <motion.span
              animate={{ x: [2, -3, 1, 0], opacity: [0.16, 0.35, 0.12, 0.2] }}
              transition={{ duration: 0.22, repeat: Infinity, repeatDelay: 3.6 }}
              className="absolute inset-0 text-red-500/35 blur-[1px]"
            >
              TOKYO
            </motion.span>
            <motion.span
              animate={{ x: [-2, 3, -1, 0], opacity: [0.12, 0.28, 0.1, 0.16] }}
              transition={{ duration: 0.18, repeat: Infinity, repeatDelay: 4.2 }}
              className="absolute inset-0 text-white/20 translate-x-2 blur-[1px]"
            >
              TOKYO
            </motion.span>
            <span className="absolute inset-0 text-white/10 -translate-x-2">TOKYO</span>
            <span className="relative z-10">TOKYO</span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 50, letterSpacing: "0px" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "4px" }}
            transition={{ delay: 0.5, duration: 1.2 }}
            className="mt-2 text-4xl font-bold text-gray-200 drop-shadow-[0_0_20px_white] sm:text-5xl md:text-7xl"
          >
            <GlitchTitle>GANG</GlitchTitle>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 1 }}
            className="mt-6 text-gray-200 text-lg md:text-xl max-w-2xl mx-auto leading-9 bg-black/25 border border-white/10 rounded-3xl px-6 py-4 backdrop-blur-sm shadow-[0_0_30px_rgba(255,255,255,0.06)]"
          >
            أهلاً بك في الموقع الرسمي لعصابة TOKYO GANG. هنا يجتمع الولاء، الاحترام، والقوة داخل عالم فايف إم.
          </motion.p>

          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "340px", opacity: 1 }}
            transition={{ delay: 1.4, duration: 1.2 }}
            className="mx-auto mt-8 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
          />

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              ["TOKYO", "GANG"],
              ["TOP 1", "GANG"],
              ["24/7", "سيطرة"],
              ["∞", "نفوذ"],
            ].map(([num, label], index) => (
              <motion.div
                key={`${num}-${label}`}
                initial={{ opacity: 0, y: 24, rotateX: 18 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: 1.45 + index * 0.1, duration: 0.65 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden bg-black/50 border border-white/20 rounded-2xl p-4 backdrop-blur-md group shadow-[0_0_18px_rgba(255,255,255,0.08)]"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-white/5" />
                <motion.div
                  animate={{ x: ["-140%", "140%"] }}
                  transition={{ duration: 2.8, repeat: Infinity, delay: index * 0.22, ease: "easeInOut" }}
                  className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent"
                />
                <p className="relative z-10 text-3xl font-black drop-shadow-[0_0_14px_white]">
                  <CountUpValue value={num} />
                </p>
                <p className="relative z-10 text-gray-400 text-sm mt-1">{label}</p>
                <div className="relative z-10 mt-3 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-60" />
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <a href="#apply" className="group relative overflow-hidden px-8 py-4 bg-white text-black hover:bg-gray-300 rounded-2xl text-lg font-black transition hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.18)]">
              <span className="absolute inset-y-0 -right-1/2 w-1/2 bg-gradient-to-r from-transparent via-black/10 to-transparent transition group-hover:right-full" />
              <span className="relative z-10">ACCESS APPLICATION</span>
            </a>

            <a href={discordInviteUrl} target="_blank" className="group relative overflow-hidden px-8 py-4 border border-white/40 bg-black/35 hover:bg-white hover:text-black rounded-2xl text-lg font-black transition hover:scale-105">
              <span className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent transition group-hover:left-full" />
              <span className="relative z-10">LINK DISCORD</span>
            </a>
          </div>
        </motion.div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-zinc-950/95 px-6 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
        <div className="absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-black to-transparent" />
        <div className="absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-black to-transparent" />
        <motion.div
          animate={{ x: ["-55%", "55%"] }}
          transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
          className="flex min-w-max items-center gap-10 whitespace-nowrap text-xs font-black tracking-[4px] text-white/65 md:text-sm"
        >
          <span className="text-red-400">TOKYO CONTROL</span>
          <span>POWER / LOYALTY / RESPECT</span>
          {killfeed.map((item) => <span key={item} className="text-green-300/80">● {item}</span>)}
          <span className="text-red-400">TOKYO CONTROL</span>
          <span>POWER / LOYALTY / RESPECT</span>
        </motion.div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-black px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-green-400/20 bg-gradient-to-l from-green-400/10 via-zinc-950 to-zinc-950 p-6 shadow-[0_0_55px_rgba(74,222,128,0.08)] md:p-8"
        >
          <div className="absolute inset-y-0 left-0 w-48 bg-green-400/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black tracking-[5px] text-green-300">TOKYO DISCORD NETWORK</p>
              <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">ادخل مجتمع TOKYO الرسمي</h2>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-300">
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">المتصلون: {onlineCount ?? "جاري التحديث"}</span>
                <span className="rounded-full border border-white/10 bg-black/35 px-4 py-2">أعضاء الرتبة: {roleMemberCount ?? "جاري التحديث"}</span>
              </div>
            </div>
            <a href={discordInviteUrl} target="_blank" className="shrink-0 rounded-2xl bg-green-300 px-7 py-4 text-center font-black text-black transition hover:bg-white">
              دخول Discord
            </a>
          </div>
        </motion.div>
      </section>

      <AnnouncementsFeed />

      <RevealSection id="command" className="relative overflow-hidden border-y border-white/10 bg-black px-6 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(239,68,68,0.12),transparent_34%)]" />
        <div className="relative mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-flex rounded-full border border-red-400/20 bg-red-400/10 px-4 py-2 text-[10px] font-black tracking-[4px] text-red-300">TOKYO COMMAND</span>
        <h2 className="tokyo-section-title mt-5 text-5xl font-black text-center mb-4 md:text-6xl">
          <GlitchTitle>القيادة العليا</GlitchTitle>
        </h2>
        <p className="text-center leading-7 text-gray-400">المستوى الأعلى في منظومة TOKYO وصنّاع القرار داخل العصابة.</p>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["سيلفادور كروز", "القائد الأعلى"],
            ["توتي كروز", "الزعيم"],
            ["حمدان كروز", "نائب القائد"],
            ["برلين كروز", "نائب القائد"],
            ["سنتياغو كروز", "العقل المدبر"],
          ].map(([name, role], index) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 80, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.15, duration: 0.8 }}
              whileHover={{ scale: 1.07, y: -10 }}
              className="tokyo-glass group relative overflow-hidden rounded-[30px] p-6 text-center transition-colors hover:border-red-400/35"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-white/15 via-transparent to-red-500/10" />
              <motion.div
                animate={{ x: ["-120%", "120%"] }}
                transition={{ duration: 3.6, repeat: Infinity, delay: index * 0.3, ease: "easeInOut" }}
                className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />
              <div className="absolute left-4 top-4 rounded-full border border-red-500/30 px-3 py-1 text-[10px] font-black tracking-[3px] text-red-300">
                HC-{String(index + 1).padStart(2, "0")}
              </div>

              <div className="relative z-10">
                <div className="mx-auto mb-5 w-24 h-24 rounded-full bg-white text-black flex items-center justify-center text-4xl font-black shadow-[0_0_35px_white] ring-4 ring-white/10 group-hover:ring-red-500/20 transition">
                  {name[0]}
                </div>

                <p className="text-xs tracking-[5px] text-gray-500 mb-3">HIGH COMMAND</p>
                <h3 className="text-3xl font-black text-white drop-shadow-[0_0_20px_white]">{name}</h3>
                <p className="mt-3 text-gray-400">{role}</p>
                <div className="mt-6 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />

                <p className="mt-5 text-red-500 font-black tracking-[3px] drop-shadow-[0_0_12px_red]">
                  AUTHORITY LEVEL: MAX
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      <RevealSection id="streamers" className="relative overflow-hidden border-y border-red-950/80 bg-[#030303] px-5 py-28 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(127,29,29,0.32),transparent_32%),radial-gradient(circle_at_12%_70%,rgba(83,252,24,0.055),transparent_25%),linear-gradient(180deg,#070707_0%,#020202_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />
        <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full border border-red-500/10" />
        <div className="pointer-events-none absolute -right-32 bottom-12 h-96 w-96 rounded-full border border-white/5" />

        <div className="relative mx-auto mb-16 max-w-3xl text-center">
          <div className="mb-5 flex items-center justify-center gap-3 text-[10px] font-black tracking-[0.45em] text-red-400 sm:text-xs">
            <span className="h-px w-10 bg-gradient-to-l from-red-500 to-transparent sm:w-20" />
            MEDIA DIVISION // 05
            <span className="h-px w-10 bg-gradient-to-r from-red-500 to-transparent sm:w-20" />
          </div>
          <h2 className="tokyo-streamer-name text-5xl font-extrabold text-white sm:text-6xl lg:text-7xl">ستريمرز العصابة</h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-zinc-400 sm:text-base">
            الواجهة الإعلامية الرسمية لـ TOKYO — بث، حضور، وهيبة بلا انقطاع.
          </p>
          <div className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-5 py-2 text-[10px] font-black tracking-[0.28em] text-zinc-400 backdrop-blur-xl">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#53fc18] shadow-[0_0_14px_#53fc18]" />
            OFFICIAL TOKYO CREATORS
          </div>
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-6">
          {[
  {
    name: "بابلو كروز",
    role: "Kick Partner",
    handle: "@pablo_jo",
    kick: "https://kick.com/pablo_jo",
    tiktok: "https://tiktok.com/@pablo",
    logo: "https://files.kick.com/images/user/48433338/profile_image/conversion/10176733-182a-48aa-9a6a-0b0834559265-fullsize.webp",
    verified: true,
  },
  {
    name: "برلين كروز",
    role: "Kick Partner",
    handle: "@berlin_br",
    kick: "https://kick.com/berlin_br",
    logo: "https://files.kick.com/images/user/38323508/profile_image/conversion/efd96238-b82f-43c1-a358-f838ef5b1df0-fullsize.webp",
    verified: true,
  },
  {
    name: "آدم كروز",
    role: "Kick Partner",
    handle: "@adamx052",
    kick: "https://kick.com/adamx052",
    logo: "https://files.kick.com/images/user/97693230/profile_image/conversion/dc044615-712d-46e8-89ff-4caef746dbd5-fullsize.webp",
    verified: true,
  },
  {
    name: "زورو كروز",
    role: "Kick Partner",
    handle: "@zr_zoro1",
    kick: "https://kick.com/zr_zoro1",
    logo: "https://files.kick.com/images/user/51811338/profile_image/conversion/7ff27f0f-fb91-4c65-aba5-14b45847edb5-fullsize.webp",
    verified: true,
  },
  {
    name: "سيلفادور كروز",
    role: "ستريمر رسمي",
    handle: "@selvadoor1",
    kick: "https://kick.com/selvadoor1",
    logo: "https://files.kick.com/images/user/67102940/profile_image/conversion/cf78f425-3b8c-4acb-af48-660b839de87d-fullsize.webp",
    verified: false,
  },
].map((streamer, index) => (
            <motion.div
              key={streamer.name}
              initial={{ opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ y: -10 }}
              className={`tokyo-streamer-card group relative min-h-[480px] overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900/85 via-[#070707] to-black p-7 text-center shadow-[0_28px_80px_rgba(0,0,0,0.55)] transition-[border-color,box-shadow] duration-500 hover:border-red-500/45 hover:shadow-[0_32px_100px_rgba(0,0,0,0.7),0_0_45px_rgba(239,68,68,0.12)] lg:col-span-2 ${index === 3 ? "lg:col-start-2" : ""} ${index === 4 ? "lg:col-start-4" : ""}`}
            >
              <div className="absolute left-6 top-6 font-mono text-xs font-black tracking-[0.24em] text-red-500/65">
                CREATOR {String(index + 1).padStart(2, "0")}
              </div>
              <div className="absolute right-6 top-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-[9px] font-black tracking-[0.22em] text-zinc-400 backdrop-blur-md">
                KICK UNIT
                <span className="h-1.5 w-1.5 rounded-full bg-[#53fc18] shadow-[0_0_10px_#53fc18]" />
              </div>

              <div className="relative z-10 flex h-full flex-col items-center pt-12">
                <div className="relative mx-auto mb-7 h-36 w-36">
                  <div className="absolute inset-[-9px] rounded-full border border-red-500/35 shadow-[0_0_35px_rgba(239,68,68,0.24)] transition duration-500 group-hover:scale-105 group-hover:border-red-400/70" />
                  <div className="absolute inset-[-2px] animate-pulse rounded-full bg-[conic-gradient(from_20deg,transparent,rgba(239,68,68,0.85),transparent_38%,rgba(83,252,24,0.4),transparent_72%)] opacity-65" />
                  <div className="relative h-36 w-36 overflow-hidden rounded-full border-4 border-black bg-zinc-900 shadow-[0_0_38px_rgba(255,255,255,0.16)]">
                  <Image
                    src={streamer.logo}
                    alt={streamer.name}
                    width={144}
                    height={144}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  </div>
</div>

                <p className="mb-2 font-mono text-[10px] tracking-[0.5em] text-zinc-500">LIVE CREATOR</p>
                <div className="flex items-center justify-center gap-2.5" dir="rtl">
                  <h3 className="tokyo-streamer-name text-4xl font-extrabold leading-tight text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.24)]">{streamer.name}</h3>
                  {streamer.verified && (
                    <span
                      aria-label="Kick Partner موثّق"
                      title="Kick Partner موثّق"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#53fc18] text-black shadow-[0_0_20px_rgba(83,252,24,0.7)]"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[3]">
                        <path d="m6.5 12.5 3.3 3.2 7.7-8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                </div>
                <p dir="ltr" className="mt-1 font-mono text-[10px] tracking-[0.18em] text-zinc-600">{streamer.handle}</p>
                <p className={`tokyo-streamer-partner mt-4 text-lg font-semibold tracking-wide ${streamer.verified ? "text-[#53fc18]" : "text-zinc-400"}`}>
                  {streamer.role}
                </p>

                <div className="mt-auto flex w-full justify-center gap-3 pt-7">
                  <a
                    href={streamer.kick}
                    target="_blank"
                    rel="noreferrer"
                    className="group/kick inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-[#53fc18] px-7 py-3.5 font-black text-black shadow-[0_0_26px_rgba(83,252,24,0.24)] transition hover:bg-white hover:shadow-[0_0_34px_rgba(83,252,24,0.45)]"
                  >
                    Kick
                    <span aria-hidden="true" className="transition-transform group-hover/kick:-translate-y-0.5 group-hover/kick:translate-x-0.5">↗</span>
                  </a>

                  {streamer.tiktok && (
                    <a
                      href={streamer.tiktok}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-w-32 items-center justify-center rounded-xl border border-pink-500/70 bg-pink-500/5 px-7 py-3.5 font-bold text-pink-400 shadow-[0_0_18px_rgba(236,72,153,0.16)] transition hover:bg-pink-500 hover:text-white"
                    >
                      TikTok
                    </a>
                  )}
                </div>
                <div className="mt-7 h-px w-full bg-gradient-to-r from-transparent via-red-500/45 to-transparent" />
              </div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      <RevealSection id="rules" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-14">قوانين العصابة</h2>
        <p className="mx-auto -mt-8 mb-10 max-w-2xl text-center leading-8 text-gray-400">
          القوانين إلزامية لكل عضو، وسيتم سؤال المتقدم عنها أثناء المقابلة.
        </p>
        <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TOKYO_RULES.map((rule, i) => (
            <div key={rule} className="border border-white/20 bg-zinc-950 rounded-3xl p-5 hover:border-white transition">
              <p className="mb-3 text-xs font-black tracking-[3px] text-red-400">RULE {String(i + 1).padStart(2, "0")}</p>
              <p className="leading-8 text-gray-200">{rule}</p>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection id="timeline" className="py-24 px-6 bg-zinc-950 border-y border-white/10">
        <h2 className="text-5xl font-black text-center mb-4">TOKYO TIMELINE</h2>
        <p className="text-center text-gray-500 tracking-[4px] mb-14">سجل الهيبة والتطور</p>

        <div className="mx-auto max-w-5xl">
          <div className="relative grid gap-6 md:grid-cols-4">
            <div className="absolute left-0 right-0 top-10 hidden h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent md:block" />
            {timeline.map(([title, desc], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.12 }}
                className="relative rounded-3xl border border-white/15 bg-black p-6 shadow-[0_0_35px_rgba(255,255,255,0.06)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl font-black text-black shadow-[0_0_22px_rgba(255,255,255,0.35)]">
                  {index + 1}
                </div>
                <h3 className="text-2xl font-black text-white">{title}</h3>
                <p className="mt-4 leading-8 text-gray-400">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection id="wars" className="py-24 px-6 bg-zinc-950">
        <h2 className="text-5xl font-black text-center mb-14">سجل الحروب</h2>

        <div className="max-w-4xl mx-auto space-y-4">
          {["TOKYO GANG صار عالمي والقادم أعظم", "إعدام أول خائن", "فرضت السيطرة المباشرة بأراضي أنفنتي"].map((war, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-black border border-white/20 rounded-2xl p-5 flex justify-between"
            >
              <span>{war}</span>
              <span className="text-gray-500">2026</span>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      <RevealSection id="apply" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-8">تقديم الانضمام</h2>

        {!session.data ? (
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-zinc-950 p-8 text-center shadow-[0_0_50px_rgba(255,255,255,0.06)]">
            <button
              type="button"
              onClick={() => signIn("discord")}
              className="w-full rounded-2xl bg-white py-4 font-black text-black transition hover:bg-gray-300"
            >
              سجل دخول بالديسكورد أول
            </button>
          </div>
        ) : (
          <ApplicationForm />
        )}
      </RevealSection>

      <footer className="relative overflow-hidden border-t border-white/10 bg-black px-6 py-12 text-gray-400">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
          <div>
            <p className="text-2xl font-black tracking-[7px] text-white">TOKYO GANG</p>
            <p className="mt-3 text-sm leading-7">Official command portal. Built for control, loyalty, and presence.</p>
          </div>
          <div className="grid gap-2 text-sm">
            <a href="#apply" className="hover:text-white">التقديم</a>
            <a href="/status" className="hover:text-white">حالة الطلب</a>
            <a href="/complaints" className="hover:text-white">الشكاوي</a>
          </div>
          <div className="text-sm md:text-left">
            <p>SERVER STATUS: LINKED</p>
            <p>ONLINE: {onlineCount ?? "SYNCING"}</p>
            <p className="mt-4 text-xs tracking-[4px] text-gray-600">Dev by Hamdan | 2026</p>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            type="button"
            aria-label="الرجوع للأعلى"
            initial={{ opacity: 0, y: 18, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            whileHover={{ scale: 1.12, y: -4 }}
            whileTap={{ scale: 0.95 }}
            className="fixed bottom-6 right-6 z-[9998] w-14 h-14 rounded-full bg-white text-black font-black border border-white/20 shadow-[0_0_25px_rgba(255,255,255,0.35)] hover:bg-gray-300 transition"
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}

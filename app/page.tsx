"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signOut, useSession } from "next-auth/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ApplicationForm } from "./ApplicationForm";
import { AnnouncementsFeed } from "./AnnouncementsFeed";
import { MobileMenu } from "./MobileMenu";

const members = [
  ["لومي المخفي", "الشبح"],
  ["أبو صقير كروز", "الدب المميز"],
  ["ريد كروز", "الزرقاوي الأصيل"],
  ["سنفور كروز", "ابن القائد"],
  ["بابلو كروز", "ستريمرنا"],
  ["جوكر كروز", "مقاتل"],
  ["عبدو كروز", "مقاتل"],
  ["أبو فايز كروز", "مقاتل"],
  ["ريكاردو كروز", "مقاتل"],
  ["ادم كروز", "مقاتل"],
  ["ابو الليل كروز", "مقاتل"],
  ["دنقل كروز", "مقاتل"],
  ["زورو كروز", "مقاتل"],
  ["شلبي كروز", "مقاتل"],
  ["ايهم كروز", "مقاتل"],
  ["قصي كروز", "مقاتل"],
  ["ليبي كروز", "مقاتل"],
  ["مختار كروز", "مقاتل"],
  ["كلاشين كروز", "مقاتل"],
  ["مافيا كروز", "مقاتل"],
  ["امير كروز", "مقاتل"],
  ["زيد كروز", "مقاتل"],
  ["صقر كروز", "مقاتل"],
  ["شتخمص كروز", "مقاتل"],
  ["بشار كروز", "مقاتل"],
  ["أبو سند كروز", "مقاتل"],
  ["ريفن كروز", "مقاتل"],
  ["سراج كروز", "مقاتل"],
  ["ريموند كروز", "مقاتل"],
  ["وليد كروز", "مقاتل"],
  ["برهوم كروز", "مقاتل"],
  ["صلاحات كروز", "مقاتل"],
];

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
  "LINKING DISCORD IDENTITY",
  "VERIFYING TOKYO CLEARANCE",
  "SYNCING ACTIVE MEMBERS",
  "ARMING ADMIN CONSOLE",
];

type DiscordMember = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  status?: "online" | "idle" | "dnd";
};

type SiteAlert = {
  id: string;
  title: string;
  message: string;
};

type SpotlightMember = {
  id: string;
  displayName: string;
  username: string;
  image: string | null;
  status: string;
  internalRank: string;
  behaviorScore: number;
};

const discordInviteUrl = "https://discord.gg/u7G6E6nvS7";

const memberStatusStyles = {
  online: "border-green-400/40 bg-green-400/10 text-green-300",
  idle: "border-yellow-400/40 bg-yellow-400/10 text-yellow-200",
  dnd: "border-red-500/40 bg-red-500/10 text-red-300",
};

const memberStatusLabels = {
  online: "ONLINE",
  idle: "IDLE",
  dnd: "DND",
};

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
    <div className="pointer-events-none fixed inset-0 z-[2] hidden overflow-hidden opacity-35 md:block">
      {Array.from({ length: 8 }).map((_, index) => (
        <motion.span
          key={index}
          animate={{
            x: [0, index % 2 === 0 ? 42 : -38, 0],
            y: [0, -80 - index * 4, 0],
            opacity: [0.08, 0.32, 0.08],
          }}
          transition={{
            duration: 7 + (index % 6),
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
  const [search, setSearch] = useState("");
  const [rank, setRank] = useState("الكل");
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [discordMembers, setDiscordMembers] = useState<DiscordMember[]>([]);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [tokyoOnlineCount, setTokyoOnlineCount] = useState<number | null>(null);
  const [roleMemberCount, setRoleMemberCount] = useState<number | null>(null);
  const [lastDiscordSync, setLastDiscordSync] = useState<Date | null>(null);
  const [siteAlert, setSiteAlert] = useState<SiteAlert | null>(null);
  const [spotlight, setSpotlight] = useState<SpotlightMember | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadSpotlight = async () => {
      const response = await fetch(`/api/spotlight?t=${Date.now()}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { member?: SpotlightMember | null } | null;
      if (active) setSpotlight(data?.member ?? null);
    };

    loadSpotlight();
    const interval = window.setInterval(loadSpotlight, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const move = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

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
      const response = await fetch(`/api/discord-members?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as {
        members?: DiscordMember[] | null;
        onlineCount?: number | null;
        tokyoOnlineCount?: number | null;
        roleMemberCount?: number | null;
      } | null;

      if (!active || !response.ok || !Array.isArray(data?.members)) return;

      const nextMembers = data.members;

      setDiscordMembers((currentMembers) => {
        const currentIds = currentMembers.map((member) => member.id).join(",");
        const nextIds = nextMembers.map((member) => member.id).join(",");
        return currentIds === nextIds ? currentMembers : nextMembers;
      });
      setOnlineCount(data?.onlineCount ?? null);
      setTokyoOnlineCount(data?.tokyoOnlineCount ?? nextMembers.length);
      setRoleMemberCount(data?.roleMemberCount ?? null);
      setLastDiscordSync(new Date());
    };

    loadDiscordMembers();
    const interval = window.setInterval(loadDiscordMembers, 1000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadAlert = async () => {
      const response = await fetch(`/api/alerts?t=${Date.now()}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { alert?: SiteAlert | null } | null;
      if (active) setSiteAlert(data?.alert ?? null);
    };

    loadAlert();
    const interval = window.setInterval(loadAlert, 30000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const filteredMembers = members.filter(([name, role]) => {
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesRank = rank === "الكل" || role === rank;
    return matchesSearch && matchesRank;
  });
  const syncedTokyoMemberCount = roleMemberCount ?? null;
  const spotlightMember = spotlight
    ? {
        id: spotlight.id,
        name: spotlight.displayName,
        username: spotlight.username,
        image: spotlight.image,
        status: spotlight.status,
        rank: spotlight.internalRank,
        score: spotlight.behaviorScore,
      }
    : {
    id: "offline",
    name: "TOKYO GANG",
    username: "high_command",
    image: null,
    status: "online" as const,
    rank: "HIGH COMMAND",
    score: 100,
  };
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
    <main dir="rtl" className="min-h-screen overflow-hidden bg-black text-white lg:cursor-none">
      <SpeedInsights />
      <Analytics />
      <AmbientParticles />

      {siteAlert && (
        <motion.div
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 top-0 z-[80] border-b border-red-500/40 bg-red-950/85 px-4 py-3 text-center text-white shadow-[0_0_35px_rgba(239,68,68,0.25)] backdrop-blur-xl"
        >
          <p className="text-xs font-black tracking-[5px] text-red-200">{siteAlert.title}</p>
          <p className="mt-1 text-sm font-bold">{siteAlert.message}</p>
        </motion.div>
      )}

      <div className="pointer-events-none fixed inset-0 z-[9997] opacity-[0.035] bg-[linear-gradient(to_bottom,white_1px,transparent_1px)] bg-[length:100%_4px]" />
      <div className="pointer-events-none fixed inset-0 z-[9996] bg-[radial-gradient(circle_at_center,transparent_45%,rgba(0,0,0,0.65)_100%)]" />
      <motion.div
        className="pointer-events-none fixed inset-0 z-[1] opacity-35"
        animate={{
          backgroundPosition: [`${mouse.x * 0.01}px ${mouse.y * 0.01}px`, `${mouse.x * 0.015}px ${mouse.y * 0.015}px`],
        }}
        transition={{ duration: 0.4 }}
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 24%, rgba(239,68,68,0.18), transparent 28%), radial-gradient(circle at 78% 18%, rgba(255,255,255,0.10), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 100% 100%, 96px 96px",
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-[9995] hidden opacity-20 mix-blend-screen md:block">
        <motion.div
          animate={{ x: ["-20%", "20%", "-20%"], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-24 h-48 w-[120vw] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.20),transparent_65%)] blur-3xl"
        />
        <motion.div
          animate={{ x: ["20%", "-15%", "20%"], y: [0, -40, 0], opacity: [0.06, 0.14, 0.06] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-32 h-56 w-[110vw] bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.16),transparent_70%)] blur-3xl"
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-0 hidden overflow-hidden md:block">
        <motion.div
          animate={{ x: [0, 120, -120, 0], y: [0, -60, 60, 0], opacity: [0.08, 0.18, 0.08] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-0 left-0 w-[900px] h-[900px] bg-white/10 blur-[180px] rounded-full"
        />
        <motion.div
          animate={{ x: [0, -100, 100, 0], y: [0, 80, -80, 0], opacity: [0.05, 0.14, 0.05] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-0 right-0 w-[1000px] h-[1000px] bg-white/10 blur-[200px] rounded-full"
        />
      </div>

      <motion.div
        className="pointer-events-none fixed z-[9999] hidden h-8 w-8 rounded-full border border-white/60 shadow-[0_0_18px_white] lg:block"
        style={{ left: mouse.x - 16, top: mouse.y - 16 }}
      />

      <motion.div
        className="pointer-events-none fixed z-[9998] hidden h-2 w-2 rounded-full bg-white shadow-[0_0_12px_white] lg:block"
        style={{ left: mouse.x - 4, top: mouse.y - 4 }}
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
              <span>INFINITE CITY CFW</span>
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

      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center gap-5">
          <h1 className="font-black tracking-[5px]">TOKYO GANG</h1>
          <MobileMenu />
          <div className="hidden md:flex gap-6 text-sm text-gray-300">
            <a href="#home" className="hover:text-white">الرئيسية</a>
            <a href="#server" className="hover:text-white">السيرفر</a>
            <a href="#command" className="hover:text-white">القيادة</a>
            <a href="#streamers" className="hover:text-white">الستريمرز</a>
            <a href="#members" className="hover:text-white">الأعضاء</a>
            <a href="#wanted" className="hover:text-white">المطلوبين</a>
            <a href="#rules" className="hover:text-white">القوانين</a>
            <a href="#wars" className="hover:text-white">الحروب</a>
            <a href="#apply" className="hover:text-white">التقديم</a>
            {session.data?.user && (
              <>
                <a href="/status" className="text-green-400 hover:text-green-300">طلبي</a>
                <a href="/complaints" className="text-cyan-300 hover:text-cyan-200">الشكاوي</a>
                <a href="/rules-internal" className="text-yellow-300 hover:text-yellow-200">القوانين الداخلية</a>
                <a href="/admin" className="text-red-400 hover:text-red-300">الإدارة</a>
              </>
            )}
          </div>
          {session.data?.user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 rounded-full border border-white/15 bg-black/50 px-3 py-2 shadow-[0_0_20px_rgba(255,255,255,0.08)]">
                {session.data.user.image && (
                  <img
                    src={session.data.user.image}
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
              className="rounded-full border border-white/20 bg-white px-5 py-2 text-sm font-black text-black transition hover:bg-gray-300"
            >
              Discord
            </button>
          )}
        </div>
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

      <div className="fixed right-6 top-24 z-40 hidden w-72 border border-green-400/20 bg-black/70 p-4 text-left backdrop-blur-md lg:block">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-black tracking-[3px] text-green-400">TOKYO NETWORK</p>
          <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_12px_lime]" />
        </div>
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

      <section id="home" className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-4 text-center md:h-screen md:px-6">
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-35 grayscale md:opacity-15" />
        <motion.div
          initial={{ opacity: 0, scale: 1.8 }}
          animate={{ opacity: loading ? 0 : [0.85, 0], scale: loading ? 1.8 : [1.8, 1] }}
          transition={{ delay: 0.05, duration: 1.2, ease: "easeOut" }}
          className="pointer-events-none absolute inset-0 z-30 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.95),rgba(255,255,255,0.12)_18%,transparent_42%)]"
        />

        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1.18, x: [0, 20, -20, 0], y: [0, -12, 12, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 hidden overflow-hidden md:block"
        >
          <video autoPlay muted loop playsInline className="w-full h-full object-cover opacity-60 grayscale scale-110">
            <source src="/bg.mp4" type="video/mp4" />
          </video>
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_46%,rgba(255,255,255,0.08)_50%,transparent_54%,transparent_100%)] opacity-45" />

        <motion.div
          animate={{ x: ["-20%", "20%"], opacity: [0.12, 0.28, 0.12] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-20 left-0 hidden h-[300px] w-[700px] rounded-full bg-white/10 blur-3xl md:block"
        />

        <motion.div
          animate={{ y: [40, -40, 40], opacity: [0.06, 0.18, 0.06] }}
          transition={{ duration: 9, repeat: Infinity }}
          className="absolute bottom-10 hidden h-[180px] w-[900px] rounded-full bg-white/10 blur-3xl md:block"
        />

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
              [syncedTokyoMemberCount === null ? "SYNC" : String(syncedTokyoMemberCount), "عضو"],
              ["TOP 1", "GANG"],
              ["24/7", "سيطرة"],
              ["∞", "نفوذ"],
            ].map(([num, label], index) => (
              <motion.div
                key={label}
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

      <section className="relative overflow-hidden border-y border-red-500/20 bg-red-950/10 py-4">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap text-sm font-black tracking-[8px] text-red-300/90"
        >
          POWER / LOYALTY / RESPECT / CONTROL / TOKYO GANG / POWER / LOYALTY / RESPECT / CONTROL / TOKYO GANG
        </motion.div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-black py-4">
        <motion.div
          animate={{ x: ["100%", "-100%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap text-sm md:text-base font-bold tracking-[4px] text-white/80"
        >
          ⚠ TOKYO GANG سيطرت على المنطقة الشرقية — ⚠ تم القضاء على أحد الخونة — ⚠ النفوذ يزداد يومياً — ⚠ TOP 1 GANG داخل السيرفر — ⚠ لا مكان للضعفاء داخل TOKYO —
        </motion.div>
      </section>

      <section className="relative overflow-hidden border-b border-white/10 bg-zinc-950 px-6 py-5">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap text-left text-xs font-black tracking-[4px] text-green-400/80"
        >
          {killfeed.map((item) => `// ${item}`).join("   ")}
        </motion.div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-black px-6 py-14">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-red-500/25 bg-red-500/10 p-6 shadow-[0_0_45px_rgba(239,68,68,0.10)]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent" />
            <p className="text-xs font-black tracking-[5px] text-red-300">MEMBER SPOTLIGHT</p>
            <div className="mt-5 flex items-center gap-5">
              {spotlightMember.image ? (
                <img src={spotlightMember.image} alt={spotlightMember.name} className="h-24 w-24 rounded-full border border-white/20 object-cover shadow-[0_0_28px_rgba(255,255,255,0.18)]" />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-black text-black shadow-[0_0_28px_rgba(255,255,255,0.2)]">
                  {spotlightMember.name[0]}
                </div>
              )}
              <div>
                <h2 className="text-4xl font-black text-white">{spotlightMember.name}</h2>
                <p className="mt-1 text-sm text-gray-400">@{spotlightMember.username}</p>
                <p className="mt-3 inline-flex rounded-full border border-green-400/25 px-3 py-1 text-xs font-black text-green-300">
                  {spotlightMember.rank} - SCORE {spotlightMember.score}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl border border-green-400/20 bg-green-400/10 p-6 shadow-[0_0_45px_rgba(74,222,128,0.08)]"
          >
            <p className="text-xs font-black tracking-[5px] text-green-300">DISCORD INVITE PANEL</p>
            <div className="mt-5 grid gap-3 text-sm text-gray-300">
              <p>SERVER: TOKYO GANG</p>
              <p>ONLINE: {onlineCount ?? "SYNCING"}</p>
              <p>TOKYO ROLE: {roleMemberCount ?? "SYNCING"}</p>
            </div>
            <a href={discordInviteUrl} target="_blank" className="mt-6 inline-block rounded-2xl bg-green-300 px-6 py-3 font-black text-black transition hover:bg-white">
              JOIN DISCORD
            </a>
          </motion.div>
        </div>
      </section>

      <RevealSection id="server" className="relative overflow-hidden border-t border-white/10 bg-black px-4 py-16 md:px-6 md:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_24%_40%,rgba(239,68,68,0.22),transparent_30%),radial-gradient(circle_at_78%_48%,rgba(255,255,255,0.10),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:100%_6px,88px_88px] opacity-60" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 md:grid-cols-[0.88fr_1.12fr] md:gap-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, rotateY: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="group relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center overflow-hidden rounded-[34px] border border-white/15 bg-zinc-950/80 p-8 shadow-[0_0_80px_rgba(255,255,255,0.10)] md:max-w-[420px] md:rounded-[42px] md:p-10"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.12),transparent_58%)]" />
            <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
            <div className="absolute inset-y-10 right-0 w-px bg-gradient-to-b from-transparent via-red-400/70 to-transparent" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
              className="absolute inset-10 rounded-full border border-dashed border-white/10"
            />
            <motion.div
              animate={{ scale: [0.94, 1.04, 0.94], opacity: [0.2, 0.42, 0.2] }}
              transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute h-44 w-44 rounded-full bg-white/10 blur-3xl md:h-56 md:w-56"
            />
            <img
              src="/server-logo.png"
              alt="Infinite City CFW"
              className="relative z-10 w-56 object-contain grayscale drop-shadow-[0_0_34px_rgba(255,255,255,0.35)] transition duration-500 group-hover:scale-105 group-hover:grayscale-0 md:w-72"
            />
          </motion.div>

          <div className="text-center md:text-right">
            <p className="text-xs font-black tracking-[6px] text-red-300 md:text-sm">مكان تواجدنا حالياً</p>
            <h2 className="mt-4 text-4xl font-black leading-tight text-white drop-shadow-[0_0_28px_rgba(255,255,255,0.24)] sm:text-5xl md:text-6xl">
              INFINITE CITY CFW
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-9 text-gray-300 md:mx-0 md:text-lg">
              حالياً تتواجد عصابة TOKYO GANG داخل سيرفر INFINITE CITY CFW، حيث نفرض حضورنا وهيبتنا داخل عالم فايف إم.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              {[
                ["SERVER", "ACTIVE"],
                ["TOKYO PRESENCE", "LOCKED"],
                ["STATUS", "CONTROL"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-[10px] font-black tracking-[3px] text-gray-500">{label}</p>
                  <p className="mt-2 text-lg font-black text-white">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RevealSection>

      <AnnouncementsFeed />

      <RevealSection id="command" className="py-24 px-6 bg-black border-y border-white/10">
        <h2 className="text-5xl font-black text-center mb-4">
          <GlitchTitle>القيادة العليا</GlitchTitle>
        </h2>
        <p className="text-center text-gray-400 mb-14 tracking-[4px]">HIGH COMMAND</p>

        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-5 gap-6">
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
              className="relative overflow-hidden bg-zinc-950 border border-white/20 rounded-[30px] p-6 text-center group shadow-[0_0_40px_rgba(255,255,255,0.08)]"
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

      <RevealSection id="streamers" className="py-24 px-6 bg-zinc-950 border-y border-white/10">
        <h2 className="text-5xl font-black text-center mb-4">ستريمرز العصابة</h2>
        <p className="text-center text-gray-400 mb-14 tracking-[4px]">TOKYO MEDIA UNIT</p>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {[
  {
    name: "بابلو كروز",
    role: "ستريمر رسمي",
    kick: "https://kick.com/pablo-jo",
    tiktok: "https://tiktok.com/@pablo",
    logo: "/pablo.webp",
  },
  {
    name: "برلين كروز",
    role: "ستريمر رسمي",
    kick: "https://kick.com/br-berlin",
    logo: "/berlin.webp",
  },
  {
    name: "أبو فايز كروز",
    role: "ستريمر رسمي",
    kick: "https://kick.com/1abufayez1",
    logo: "/abufayez.webp",
  },
  {
    name: "صلاحات كروز",
    role: "ستريمر رسمي",
    kick: "https://kick.com/salahat8",
    logo: "/salahat.webp",
  },
].map((streamer, index) => (
            <motion.div
              key={streamer.name}
              initial={{ opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 1.04, y: -8 }}
              className="relative overflow-hidden rounded-[35px] bg-black border border-white/20 p-8 text-center group shadow-[0_0_45px_rgba(255,255,255,0.08)]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-white/10 to-transparent" />

              <div className="relative z-10">
                <div className="mx-auto mb-6 w-28 h-28 rounded-full bg-white/10 border border-white/20 overflow-hidden shadow-[0_0_30px_white]">
  <img
    src={streamer.logo}
    alt={streamer.name}
    className="w-full h-full object-cover"
  />
</div>

                <p className="text-xs tracking-[5px] text-gray-500 mb-3">LIVE CREATOR</p>
                <h3 className="text-3xl font-black text-white drop-shadow-[0_0_20px_white]">{streamer.name}</h3>
                <p className="mt-3 text-gray-400">{streamer.role}</p>

                <div className="flex gap-3 justify-center mt-7 flex-wrap">
                  <a
                    href={streamer.kick}
                    target="_blank"
                    className="px-8 py-3 bg-white text-black rounded-2xl font-bold hover:bg-gray-300 transition"
                  >
                    Kick
                  </a>

                  {streamer.tiktok && (
                    <a
                      href={streamer.tiktok}
                      target="_blank"
                      className="px-8 py-3 border border-pink-500 text-pink-400 rounded-2xl font-bold hover:bg-pink-500 hover:text-white transition shadow-[0_0_18px_rgba(236,72,153,0.4)]"
                    >
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      <RevealSection id="members" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-6">
          <GlitchTitle>أعضاء TOKYO GANG</GlitchTitle>
        </h2>
        <p className="text-center text-gray-400 mb-10">
          قاعدة بيانات كاملة لأعضاء العصابة وعددهم {syncedTokyoMemberCount === null ? "جاري المزامنة" : `${syncedTokyoMemberCount} عضو`}
        </p>

        <div className="mx-auto mb-14 max-w-7xl">
          <p className="mb-6 text-center text-sm font-black tracking-[5px] text-green-400">
            <span className="inline-flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-green-400 shadow-[0_0_14px_lime]" />
              TOKYO ROLE ONLINE: {tokyoOnlineCount ?? "SYNCING"}
            </span>
          </p>
          {discordMembers.length > 0 ? (
            <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {discordMembers.slice(0, 12).map((member) => (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, y: 14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  whileHover={{ scale: 1.04, y: -6 }}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-3xl border border-green-400/20 bg-green-400/5 p-4 shadow-[0_0_28px_rgba(74,222,128,0.08)]"
                >
                  <motion.div
                    animate={{ x: ["-120%", "140%"] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-green-300/10 to-transparent"
                  />
                  {member.image ? (
                    <img src={member.image} alt={member.name} className="relative z-10 h-14 w-14 rounded-full border border-white/20 object-cover shadow-[0_0_18px_rgba(74,222,128,0.20)]" />
                  ) : (
                    <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-full bg-white text-xl font-black text-black">
                      {member.name[0]}
                    </div>
                  )}
                  <div className="relative z-10 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-black text-white">{member.name}</p>
                      {member.status && (
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${memberStatusStyles[member.status]}`}>
                          {memberStatusLabels[member.status]}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">@{member.username}</p>
                  </div>
                </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-green-400/10 bg-white/[0.03] px-6 py-10 text-center">
              <motion.div
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-green-400/10 to-transparent"
              />
              <div className="relative z-10">
                <div className="mx-auto mb-4 h-3 w-3 rounded-full bg-green-400 shadow-[0_0_18px_lime]" />
                <p className="text-sm font-black tracking-[5px] text-green-400">TOKYO CHANNEL QUIET</p>
                <p className="mt-3 text-sm font-bold text-gray-500">لا يوجد أعضاء TOKYO أونلاين حالياً</p>
              </div>
            </div>
          )}
        </div>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 mb-10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن عضو..."
            className="flex-1 bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none"
          />

          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none"
          >
            {["الكل", "العقل المدبر", "الشبح", "الدب المميز", "الزرقاوي الأصيل", "ابن القائد", "ستريمرنا", "مقاتل"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMembers.map(([name, role], index) => (
            <motion.div
              key={`${name}-${index}`}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % 8) * 0.05 }}
              className="group relative overflow-hidden bg-zinc-950 border border-white/15 rounded-3xl p-6 hover:border-white transition duration-300 shadow-[0_0_35px_rgba(255,255,255,0.04)]"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-white/10 via-transparent to-red-500/10" />
              <motion.div
                animate={{ y: ["-120%", "120%"] }}
                transition={{ duration: 3.2, repeat: Infinity, delay: (index % 4) * 0.2, ease: "easeInOut" }}
                className="absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100"
              />
              <div className="absolute right-4 top-4 rounded-full border border-red-500/25 px-3 py-1 text-[10px] font-black tracking-[3px] text-red-300 opacity-70">
                FILE
              </div>

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-full bg-white text-black mx-auto mb-5 flex items-center justify-center font-black text-2xl shadow-[0_0_24px_rgba(255,255,255,0.35)] ring-4 ring-white/10 group-hover:ring-red-500/25 transition">
                  {name[0]}
                </div>

                <h3 className="text-3xl md:text-4xl font-black text-center tracking-[4px] uppercase text-white drop-shadow-[0_0_18px_white] group-hover:scale-110 transition duration-300">
                  {name}
                </h3>

                <p className="text-center text-gray-400 mt-2">{role}</p>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400 font-bold drop-shadow-[0_0_8px_lime] animate-pulse">● متواجد</span>
                    <span className="text-red-500 font-black tracking-[2px] drop-shadow-[0_0_12px_red]">خطير جداً</span>
                  </div>

                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 2 }}
                      className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-500 to-white shadow-[0_0_20px_red]"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 tracking-[2px]">
                    <span>THREAT LEVEL</span>
                    <span>MAXIMUM</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      <RevealSection id="wanted" className="py-24 px-6 bg-black border-y border-white/10">
        <h2 className="text-5xl font-black text-center mb-4">MOST WANTED</h2>
        <p className="text-center text-gray-500 tracking-[4px] mb-14">TOKYO TARGET DATABASE</p>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            ["C-1", "بلاك ليست ومطلوب", "BLACKLIST"],
            ["F-0", "مطلوب", "WANTED"],
          ].map(([name, type, status], index) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 1.05, y: -8 }}
              className="relative overflow-hidden rounded-[35px] bg-zinc-950 border border-red-500/35 p-8 text-center shadow-[0_0_40px_rgba(255,0,0,0.14)]"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />

              <div className="relative z-10">
                <div className="mx-auto mb-6 w-28 h-28 rounded-full bg-red-950 border border-red-500/50 flex items-center justify-center text-red-500 text-4xl font-black drop-shadow-[0_0_15px_red]">
                  !
                </div>

                <p className="text-xs tracking-[5px] text-red-500 mb-3">{status}</p>
                <h3 className="text-5xl font-black text-white drop-shadow-[0_0_18px_white]">{name}</h3>
                <p className="mt-3 text-gray-400">{type}</p>
                <div className="mt-6 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
                <p className="mt-5 text-red-500 font-black tracking-[3px]">THREAT: MAXIMUM</p>
              </div>
            </motion.div>
          ))}
        </div>
      </RevealSection>

      <RevealSection id="rules" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-14">قوانين العصابة</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {["الاحترام بين الأعضاء خط أحمر", "ممنوع الخيانة أو تسريب معلومات", "الالتزام بأوامر القيادة", "ممنوع التخريب بدون سبب", "الحضور وقت الاجتماعات مهم", "الهيبة قبل كل شيء"].map((rule, i) => (
            <div key={i} className="border border-white/20 bg-zinc-950 rounded-3xl p-6 text-center hover:border-white transition">
              {rule}
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

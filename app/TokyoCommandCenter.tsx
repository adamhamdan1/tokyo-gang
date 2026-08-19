"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

type ModuleId = "network" | "operations" | "security";

const modules: Array<{
  id: ModuleId;
  code: string;
  label: string;
  title: string;
  description: string;
  items: Array<{ label: string; value: string }>;
}> = [
  {
    id: "network",
    code: "NET-01",
    label: "الشبكة",
    title: "Discord Live Intelligence",
    description: "بيانات حقيقية ومباشرة من سيرفر TOKYO مع دورة مزامنة تلقائية كل 60 ثانية.",
    items: [
      { label: "BOT LINK", value: "ACTIVE" },
      { label: "MEMBER SYNC", value: "60 SEC" },
      { label: "DATABASE", value: "LINKED" },
      { label: "PRESENCE", value: "LIVE" },
    ],
  },
  {
    id: "operations",
    code: "OPS-02",
    label: "العمليات",
    title: "TOKYO Operations Matrix",
    description: "منظومة واحدة تربط القيادة، التقديمات، التحذيرات، الإجازات والاستدعاءات.",
    items: [
      { label: "HIGH COMMAND", value: "05" },
      { label: "MEDIA UNIT", value: "05" },
      { label: "RECRUITMENT", value: "OPEN" },
      { label: "CONTROL", value: "24 / 7" },
    ],
  },
  {
    id: "security",
    code: "SEC-03",
    label: "الحماية",
    title: "Protected Command Access",
    description: "دخول Discord OAuth وصلاحيات إدارية دقيقة مع إعدادات محفوظة في قاعدة البيانات.",
    items: [
      { label: "AUTH", value: "OAUTH 2" },
      { label: "ACCESS", value: "RBAC" },
      { label: "ROLE CONFIG", value: "DATABASE" },
      { label: "WEBHOOKS", value: "AUTO REPAIR" },
    ],
  },
];

const radarSignals = [
  { top: "18%", left: "52%", delay: "0s", label: "HQ" },
  { top: "36%", left: "76%", delay: "0.8s", label: "MEDIA" },
  { top: "68%", left: "67%", delay: "1.7s", label: "OPS" },
  { top: "72%", left: "28%", delay: "2.4s", label: "DB" },
  { top: "38%", left: "23%", delay: "3.1s", label: "AUTH" },
];

export function TokyoCommandCenter({
  onlineCount,
  roleMemberCount,
  lastDiscordSync,
  performanceMode,
}: {
  onlineCount: number | null;
  roleMemberCount: number | null;
  lastDiscordSync: Date | null;
  performanceMode: boolean;
}) {
  const [activeModule, setActiveModule] = useState<ModuleId>("network");
  const [clock, setClock] = useState("--:--:--");

  useEffect(() => {
    const formatClock = () => {
      setClock(
        new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Europe/Stockholm",
        }).format(new Date()),
      );
    };

    formatClock();
    const timer = window.setInterval(formatClock, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const selected = modules.find((module) => module.id === activeModule) ?? modules[0];
  const lastSync = lastDiscordSync ? lastDiscordSync.toLocaleTimeString("en-GB") : "WAITING";

  return (
    <section id="operations" className="relative overflow-hidden border-y border-red-950/70 bg-[#020202] px-5 py-28 sm:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(239,68,68,0.16),transparent_30%),radial-gradient(circle_at_88%_76%,rgba(34,197,94,0.06),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[length:100%_100%,100%_100%,64px_64px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-500/80 to-transparent" />

      <div className="relative mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          className="mb-14 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-3xl">
            <div className="mb-5 flex items-center gap-3 font-mono text-[10px] font-black tracking-[0.35em] text-red-400 sm:text-xs">
              <span className="h-2 w-2 animate-pulse rounded-full bg-red-500 shadow-[0_0_12px_red]" />
              TOKYO INTELLIGENCE SYSTEM // ONLINE
            </div>
            <h2 className="tokyo-streamer-name text-5xl font-extrabold leading-tight text-white sm:text-6xl lg:text-7xl">
              مركز القيادة الحي
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
              طبقة تحكم تفاعلية تعرض قوة البنية التقنية للموقع واتصالها المباشر بمنظومة TOKYO.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 font-mono text-[10px] tracking-[0.2em] text-zinc-500">
            <span dir="ltr" className="rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5">LOCAL {clock}</span>
            <span dir="ltr" className="rounded-full border border-green-400/20 bg-green-400/5 px-4 py-2.5 text-green-300">SYNC {lastSync}</span>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, x: -45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="tokyo-command-panel relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/80 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.6)] sm:p-8"
          >
            <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-5 font-mono text-[10px] tracking-[0.24em]">
              <span className="text-red-400">TACTICAL SIGNAL MAP</span>
              <span className="text-zinc-600">GRID // 35.01-N</span>
            </div>

            <div className="grid items-center gap-8 lg:grid-cols-[minmax(320px,1fr)_230px]">
              <div className="relative mx-auto aspect-square w-full max-w-[520px] overflow-hidden rounded-full border border-red-500/25 bg-black shadow-[inset_0_0_80px_rgba(239,68,68,0.08),0_0_60px_rgba(239,68,68,0.08)]">
                <div className="tokyo-radar-grid absolute inset-0 rounded-full opacity-60" />
                <div className="absolute inset-[12%] rounded-full border border-white/10" />
                <div className="absolute inset-[25%] rounded-full border border-white/10" />
                <div className="absolute inset-[38%] rounded-full border border-white/10" />
                <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
                {!performanceMode && <div className="tokyo-radar-sweep absolute inset-0 rounded-full" />}

                {radarSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="tokyo-radar-signal absolute z-20"
                    style={{ top: signal.top, left: signal.left, animationDelay: signal.delay }}
                  >
                    <span className="absolute -left-7 top-3 font-mono text-[8px] tracking-[0.15em] text-green-300/70">{signal.label}</span>
                  </div>
                ))}

                <div className="absolute left-1/2 top-1/2 z-20 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-red-400/40 bg-black/80 shadow-[0_0_38px_rgba(239,68,68,0.25)] sm:h-28 sm:w-28">
                  <Image src="/tokyo-logo-clean.png" alt="TOKYO command node" width={78} height={78} className="h-16 w-16 object-contain sm:h-20 sm:w-20" />
                </div>

                <div dir="ltr" className="absolute bottom-[8%] left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-green-400/20 bg-black/70 px-4 py-2 font-mono text-[8px] tracking-[0.25em] text-green-300 backdrop-blur-md sm:text-[10px]">
                  05 NODES CONNECTED
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                {[
                  ["SERVER ONLINE", onlineCount ?? "—", "text-green-300"],
                  ["TOKYO MEMBERS", roleMemberCount ?? "—", "text-white"],
                  ["SYNC CYCLE", "60 SEC", "text-red-300"],
                  ["SYSTEM", "LINKED", "text-cyan-300"],
                ].map(([label, value, tone]) => (
                  <div key={String(label)} className="rounded-2xl border border-white/10 bg-black/45 p-4 transition hover:border-white/20 hover:bg-white/[0.04]">
                    <p className="font-mono text-[8px] tracking-[0.2em] text-zinc-600 sm:text-[9px]">{label}</p>
                    <p dir="ltr" className={`mt-2 font-mono text-2xl font-black sm:text-3xl ${tone}`}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 45 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            className="flex min-h-[620px] flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-b from-zinc-900/85 to-black shadow-[0_30px_100px_rgba(0,0,0,0.6)]"
          >
            <div className="grid grid-cols-3 border-b border-white/10 bg-black/40 p-2">
              {modules.map((module) => (
                <button
                  key={module.id}
                  type="button"
                  aria-pressed={module.id === activeModule}
                  onClick={() => setActiveModule(module.id)}
                  className={`rounded-xl px-3 py-3 text-center transition ${
                    module.id === activeModule
                      ? "bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.22)]"
                      : "text-zinc-500 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="block font-mono text-[8px] tracking-[0.2em] opacity-70">{module.code}</span>
                  <span className="tokyo-streamer-name mt-1 block text-sm font-bold sm:text-base">{module.label}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.28 }}
                className="flex flex-1 flex-col p-6 sm:p-8"
              >
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.3em] text-red-400">{selected.code} {"//"} ACTIVE MODULE</p>
                    <h3 className="mt-4 text-3xl font-black text-white sm:text-4xl">{selected.title}</h3>
                  </div>
                  <span className="mt-1 h-3 w-3 shrink-0 animate-pulse rounded-full bg-green-400 shadow-[0_0_18px_lime]" />
                </div>

                <p className="mt-5 leading-8 text-zinc-400">{selected.description}</p>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  {selected.items.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-black/40 p-4">
                      <p className="font-mono text-[8px] tracking-[0.16em] text-zinc-600 sm:text-[9px]">{item.label}</p>
                      <p dir="ltr" className="mt-2 font-mono text-sm font-black text-white sm:text-base">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-8">
                  <div className="mb-4 flex items-center justify-between font-mono text-[9px] tracking-[0.2em] text-zinc-600">
                    <span>LIVE SYSTEM FEED</span>
                    <span>{clock}</span>
                  </div>
                  <div dir="ltr" className="space-y-2 rounded-2xl border border-white/10 bg-black/50 p-4 text-left font-mono text-[10px] text-zinc-500">
                    <p><span className="text-green-400">●</span> Discord member synchronization ready</p>
                    <p><span className="text-green-400">●</span> Database role configuration mounted</p>
                    <p><span className="text-green-400">●</span> Managed webhook recovery armed</p>
                    <p><span className="text-red-400">●</span> TOKYO command channel secured</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

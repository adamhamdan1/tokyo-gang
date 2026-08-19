"use client";

import { useEffect, useRef, useState } from "react";

const sections = [
  { id: "home", label: "HOME", code: "00" },
  { id: "command", label: "COMMAND", code: "01" },
  { id: "operations", label: "INTEL", code: "02" },
  { id: "streamers", label: "MEDIA", code: "03" },
  { id: "rules", label: "CODE", code: "04" },
  { id: "wars", label: "ARCHIVE", code: "05" },
  { id: "apply", label: "JOIN", code: "06" },
] as const;

export function ScrollCommandHud({ performanceMode }: { performanceMode: boolean }) {
  const glowRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]["id"]>("home");

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      setProgress(Math.min(100, Math.max(0, Math.round((window.scrollY / maxScroll) * 100))));

      const marker = window.scrollY + window.innerHeight * 0.38;
      let nextSection: (typeof sections)[number]["id"] = "home";

      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element && element.offsetTop <= marker) nextSection = section.id;
      }

      setActiveSection(nextSection);
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  useEffect(() => {
    const glow = glowRef.current;
    const canTrackPointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!glow || performanceMode || !canTrackPointer || reducedMotion) return;

    let frame = 0;
    let x = -500;
    let y = -500;

    const render = () => {
      frame = 0;
      glow.style.transform = `translate3d(${x - 190}px, ${y - 190}px, 0)`;
      glow.style.opacity = "1";
    };

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, [performanceMode]);

  const current = sections.find((section) => section.id === activeSection) ?? sections[0];

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[95] h-[2px] bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-red-950 via-red-500 to-white shadow-[0_0_16px_rgba(239,68,68,0.9)] transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      {!performanceMode && (
        <div
          ref={glowRef}
          aria-hidden="true"
          className="pointer-events-none fixed left-0 top-0 z-[3] hidden h-[380px] w-[380px] rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.12),rgba(239,68,68,0.035)_36%,transparent_68%)] opacity-0 mix-blend-screen blur-2xl transition-opacity duration-500 lg:block"
        />
      )}

      <nav aria-label="مؤشر أقسام الصفحة" className="fixed left-5 top-1/2 z-50 hidden -translate-y-1/2 2xl:block">
        <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/65 p-2.5 backdrop-blur-xl">
          {sections.map((section) => {
            const active = section.id === activeSection;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                aria-label={section.label}
                title={section.label}
                className={`group flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-[9px] transition ${
                  active
                    ? "border-red-400/60 bg-red-500/20 text-red-200 shadow-[0_0_16px_rgba(239,68,68,0.25)]"
                    : "border-white/5 bg-white/[0.025] text-zinc-600 hover:border-white/20 hover:text-white"
                }`}
              >
                {section.code}
              </a>
            );
          })}
        </div>
      </nav>

      <div className="pointer-events-none fixed bottom-5 left-1/2 z-40 hidden -translate-x-1/2 md:block">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/70 px-4 py-2 font-mono text-[9px] tracking-[0.2em] text-zinc-500 shadow-[0_15px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_10px_red]" />
          TOKYO // {current.label}
          <span className="text-zinc-700">{String(progress).padStart(2, "0")}%</span>
        </div>
      </div>
    </>
  );
}

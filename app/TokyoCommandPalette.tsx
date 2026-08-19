"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { MEMBER_NAVIGATION, PRIMARY_NAVIGATION } from "@/lib/site-navigation";

type AdminMember = {
  id: string;
  name: string;
  username: string;
};

type Command = {
  id: string;
  label: string;
  hint: string;
  href: string;
  group: string;
  keywords: string;
};

const publicCommands: Command[] = [
  ...PRIMARY_NAVIGATION.map((item) => ({
    id: item.id,
    label: item.label,
    hint: `انتقال إلى قسم ${item.label}`,
    href: item.href,
    group: "أقسام الموقع",
    keywords: `${item.label} ${item.id} ${item.code}`,
  })),
  ...MEMBER_NAVIGATION.map((item) => ({
    id: item.href,
    label: item.label,
    hint: "فتح نظام الأعضاء",
    href: item.href,
    group: "أنظمة TOKYO",
    keywords: `${item.label} ${item.code}`,
  })),
];

const adminCommands: Command[] = [
  ["overview", "نظرة عامة", "مركز القيادة", "/admin"],
  ["applications", "التقديمات", "الطلبات والمقابلات والقرارات", "/admin?mode=APPLICATIONS"],
  ["discipline", "الانضباط", "الشكاوى والاستدعاءات والإجازات", "/admin?mode=DISCIPLINE"],
  ["members", "الأعضاء", "ملفات وتقييمات أعضاء TOKYO", "/admin?mode=MEMBERS"],
  ["system", "النظام", "Discord والرتب والويب هوكس والمحتوى", "/admin?mode=SYSTEM"],
].map(([id, label, hint, href]) => ({ id, label, hint, href, group: "أقسام الإدارة", keywords: `${id} ${label} ${hint}` }));

export function TokyoCommandPalette({
  variant = "public",
  members = [],
  className = "",
  label,
}: {
  variant?: "public" | "admin";
  members?: AdminMember[];
  className?: string;
  label?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  const commands = useMemo(() => {
    const base = variant === "admin" ? adminCommands : publicCommands;
    if (variant !== "admin") return base;

    return [
      ...base,
      ...members.map((member) => ({
        id: `member-${member.id}`,
        label: member.name,
        hint: `@${member.username} — فتح ملف العضو`,
        href: `/admin/members/${member.id}`,
        group: "ملفات الأعضاء",
        keywords: `${member.name} ${member.username} عضو member`,
      })),
    ];
  }, [members, variant]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("ar");
    if (!normalized) return commands.slice(0, 12);
    return commands.filter((command) => `${command.label} ${command.hint} ${command.keywords}`.toLocaleLowerCase("ar").includes(normalized)).slice(0, 20);
  }, [commands, query]);

  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
      if (event.key === "Escape") setOpen(false);
    };
    const openFromExternal = (event: Event) => {
      const requestedVariant = (event as CustomEvent<"public" | "admin">).detail;
      if (!requestedVariant || requestedVariant === variant) setOpen(true);
    };
    window.addEventListener("keydown", toggle);
    window.addEventListener("tokyo:command-open", openFromExternal);
    return () => {
      window.removeEventListener("keydown", toggle);
      window.removeEventListener("tokyo:command-open", openFromExternal);
    };
  }, [variant]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const run = (command: Command | undefined) => {
    if (!command) return;
    setOpen(false);
    setQuery("");
    if (command.href.startsWith("#")) {
      document.querySelector(command.href)?.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", command.href);
      window.dispatchEvent(new CustomEvent("tokyo:navigate", { detail: command.href.slice(1) }));
      return;
    }
    router.push(command.href);
  };

  return (
    <>
      <button
        id={`tokyo-command-trigger-${variant}`}
        type="button"
        onClick={() => setOpen(true)}
        className={className || "flex h-10 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.035] px-3 text-xs font-black text-zinc-400 transition hover:border-red-400/30 hover:bg-red-400/[0.07] hover:text-white"}
        aria-label="فتح البحث السريع"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
        </svg>
        {label && <span>{label}</span>}
        <span dir="ltr" className="hidden rounded-md border border-white/10 bg-black/50 px-1.5 py-0.5 font-mono text-[8px] text-zinc-600 2xl:inline">Ctrl K</span>
      </button>

      {mounted && createPortal(<AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="مركز أوامر TOKYO"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10000] flex items-start justify-center bg-black/80 px-3 pt-[10vh] backdrop-blur-md sm:px-6 sm:pt-[14vh]"
            onMouseDown={(event) => {
              if (event.currentTarget === event.target) setOpen(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: -18, scale: 0.975 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.985 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-2xl overflow-hidden rounded-[30px] border border-white/12 bg-[#080808] shadow-[0_40px_140px_rgba(0,0,0,0.9),0_0_55px_rgba(239,68,68,0.12)]"
            >
              <div className="relative border-b border-white/10 p-3 sm:p-4">
                <div className="absolute inset-x-20 top-0 h-px bg-gradient-to-r from-transparent via-red-400/70 to-transparent" />
                <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute right-7 top-1/2 h-5 w-5 -translate-y-1/2 text-red-400">
                  <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                  <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
                </svg>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setActiveIndex((current) => Math.min(filtered.length - 1, current + 1));
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setActiveIndex((current) => Math.max(0, current - 1));
                    }
                    if (event.key === "Enter") run(filtered[activeIndex]);
                  }}
                  placeholder={variant === "admin" ? "ابحث عن عضو، تقديم، شكوى أو إعداد..." : "وين بدك تروح؟ ابحث داخل TOKYO..."}
                  className="w-full rounded-2xl border border-white/10 bg-black/55 py-4 pr-12 pl-14 text-sm font-bold text-white outline-none placeholder:text-zinc-600 focus:border-red-400/40 sm:text-base"
                />
                <button type="button" onClick={() => setOpen(false)} className="absolute left-7 top-1/2 -translate-y-1/2 rounded-lg border border-white/10 px-2 py-1 font-mono text-[9px] text-zinc-500 hover:text-white">ESC</button>
              </div>

              <div className="tokyo-scrollbar max-h-[55vh] overflow-y-auto p-2 sm:p-3">
                {filtered.map((command, index) => (
                  <button
                    key={command.id}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => run(command)}
                    className={`flex w-full items-center gap-4 rounded-2xl border px-4 py-3.5 text-right transition ${index === activeIndex ? "border-red-400/30 bg-red-400/[0.09]" : "border-transparent hover:bg-white/[0.035]"}`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border font-mono text-[10px] ${index === activeIndex ? "border-red-400/30 bg-red-400/15 text-red-200" : "border-white/10 bg-white/[0.025] text-zinc-600"}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">{command.label}</span>
                      <span className="mt-1 block truncate text-xs text-zinc-500">{command.hint}</span>
                    </span>
                    <span className="hidden text-[9px] font-black tracking-[2px] text-zinc-700 sm:block">{command.group}</span>
                  </button>
                ))}

                {filtered.length === 0 && (
                  <div className="px-5 py-12 text-center">
                    <p className="font-black text-white">ما لقينا نتيجة</p>
                    <p className="mt-2 text-xs text-zinc-600">جرّب اسم العضو، القسم أو الإجراء المطلوب.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-white/10 px-5 py-3 font-mono text-[9px] text-zinc-700">
                <span>TOKYO COMMAND PALETTE</span>
                <span>↑↓ تحديد&nbsp;&nbsp; ENTER فتح</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>, document.body)}
    </>
  );
}

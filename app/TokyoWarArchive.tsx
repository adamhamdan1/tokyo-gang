"use client";

import { useState } from "react";
import type { WarArchiveEntry } from "@/lib/site-content";

const statusLabels = {
  CLOSED: { label: "مكتملة", className: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" },
  ACTIVE: { label: "نشطة", className: "border-red-400/25 bg-red-400/10 text-red-300" },
  CLASSIFIED: { label: "سري", className: "border-yellow-400/25 bg-yellow-400/10 text-yellow-300" },
};

export function TokyoWarArchive({ entries }: { entries: WarArchiveEntry[] }) {
  const visibleEntries = entries.filter((entry) => entry.visible);
  const [selectedId, setSelectedId] = useState(visibleEntries[0]?.id ?? "");
  const selected = visibleEntries.find((entry) => entry.id === selectedId) ?? visibleEntries[0];

  if (!selected) return null;

  const status = statusLabels[selected.status];

  return (
    <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[0.72fr_1.28fr]">
      <div className="grid gap-3">
        {visibleEntries.map((entry, index) => {
          const active = entry.id === selected.id;
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => setSelectedId(entry.id)}
              className={`group relative overflow-hidden rounded-[26px] border p-5 text-right transition duration-300 ${
                active
                  ? "border-red-400/40 bg-red-400/[0.08] shadow-[0_18px_60px_rgba(127,29,29,0.18)]"
                  : "border-white/10 bg-black/55 hover:border-white/20 hover:bg-white/[0.035]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`font-mono text-[10px] font-black tracking-[3px] ${active ? "text-red-300" : "text-zinc-600"}`}>{entry.code}</p>
                  <h3 className="mt-2 text-xl font-black text-white">{entry.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{entry.summary}</p>
                </div>
                <span className="font-mono text-xs font-black text-zinc-600">0{index + 1}</span>
              </div>
              <div className={`absolute bottom-0 right-0 h-0.5 bg-gradient-to-l from-red-500 to-transparent transition-all duration-500 ${active ? "w-full" : "w-0 group-hover:w-1/2"}`} />
            </button>
          );
        })}
      </div>

      <article className="tokyo-operation-file relative min-h-[440px] overflow-hidden rounded-[34px] border border-white/10 bg-[#050505] p-6 shadow-[0_35px_110px_rgba(0,0,0,0.58)] sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_5%,rgba(239,68,68,0.2),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_38%)]" />
        <div className="pointer-events-none absolute left-8 top-8 h-20 w-20 border-l border-t border-red-400/20" />
        <div className="pointer-events-none absolute bottom-8 right-8 h-20 w-20 border-b border-r border-white/10" />

        <div className="relative flex h-full flex-col">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <p className="font-mono text-[10px] font-black tracking-[4px] text-red-400">TOKYO OPERATION FILE</p>
              <p className="mt-2 font-mono text-xs text-zinc-600">FILE · {selected.code} · {selected.year}</p>
            </div>
            <span className={`rounded-full border px-4 py-2 text-[10px] font-black tracking-[2px] ${status.className}`}>
              {status.label}
            </span>
          </div>

          <div className="py-8">
            <p className="text-xs font-black tracking-[3px] text-zinc-500">{selected.type}</p>
            <h3 className="tokyo-section-title mt-3 text-4xl font-black text-white sm:text-5xl">{selected.title}</h3>
            <p className="mt-5 max-w-2xl text-lg font-bold leading-9 text-zinc-300">{selected.summary}</p>
          </div>

          <div className="mt-auto grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 sm:col-span-2">
              <p className="text-[9px] font-black tracking-[3px] text-zinc-600">OPERATION OUTCOME</p>
              <p className="mt-3 text-sm font-bold leading-7 text-zinc-300">{selected.outcome}</p>
            </div>
            <div className="flex flex-col justify-between rounded-2xl border border-red-400/15 bg-red-400/[0.045] p-4">
              <p className="text-[9px] font-black tracking-[3px] text-red-400">ARCHIVE YEAR</p>
              <p className="mt-4 font-mono text-4xl font-black text-white">{selected.year}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

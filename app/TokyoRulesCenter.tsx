"use client";

import { useEffect, useMemo, useState } from "react";
import { TOKYO_RULES } from "@/lib/tokyo-content";

const categories = [
  { id: "leadership", label: "القيادة والرتب", code: "CMD", indexes: [0, 1, 13, 14, 21] },
  { id: "discipline", label: "الانضباط والحضور", code: "DSC", indexes: [2, 3, 7, 15, 23, 24] },
  { id: "security", label: "الأمن والسرية", code: "SEC", indexes: [4, 5, 6, 16, 17] },
  { id: "field", label: "الميدان والرول بلاي", code: "FLD", indexes: [8, 9, 10, 11, 12, 18, 19] },
  { id: "reputation", label: "السمعة والمحتوى", code: "REP", indexes: [20, 22] },
] as const;

const storageKey = "tokyo-reviewed-rules-v2";

export function TokyoRulesCenter() {
  const [category, setCategory] = useState<(typeof categories)[number]["id"]>("leadership");
  const [query, setQuery] = useState("");
  const [reviewed, setReviewed] = useState<number[]>([]);

  useEffect(() => {
    let savedRules: number[] = [];
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as unknown;
      if (Array.isArray(saved)) savedRules = saved.filter((value): value is number => Number.isInteger(value));
    } catch {}

    const timer = window.setTimeout(() => setReviewed(savedRules), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const activeCategory = categories.find((item) => item.id === category) ?? categories[0];
  const visibleRules = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("ar");
    const indexes = normalizedQuery ? TOKYO_RULES.map((_, index) => index) : activeCategory.indexes;

    return indexes
      .map((index) => ({ index, rule: TOKYO_RULES[index] }))
      .filter((item) => !normalizedQuery || item.rule.toLocaleLowerCase("ar").includes(normalizedQuery));
  }, [activeCategory.indexes, query]);

  const setRuleReviewed = (index: number) => {
    setReviewed((current) => {
      const next = current.includes(index) ? current.filter((value) => value !== index) : [...current, index];
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  };

  const progress = Math.round((reviewed.length / TOKYO_RULES.length) * 100);

  return (
    <div className="relative mx-auto max-w-7xl">
      <div className="grid gap-6 lg:grid-cols-[0.68fr_1.32fr]">
        <aside className="tokyo-panel h-fit p-5 lg:sticky lg:top-28 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[4px] text-red-400">TOKYO CODEX</p>
              <h3 className="mt-2 text-2xl font-black text-white">مركز القوانين</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 font-mono text-[10px] text-zinc-400">
              {reviewed.length}/{TOKYO_RULES.length}
            </span>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/45 p-4">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-zinc-400">تقدّم المراجعة</span>
              <span className="text-red-300">{progress}%</span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-red-700 via-red-400 to-white shadow-[0_0_16px_rgba(239,68,68,0.65)] transition-[width] duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-6 text-zinc-500">علّم كل قانون بعد قراءته. تقدّمك ينحفظ على نفس الجهاز.</p>
          </div>

          <div className="mt-4 grid gap-2">
            {categories.map((item) => {
              const active = item.id === category && !query;
              const completed = item.indexes.filter((index) => reviewed.includes(index)).length;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setCategory(item.id);
                    setQuery("");
                  }}
                  className={`group flex items-center justify-between rounded-2xl border px-4 py-3 text-right transition ${
                    active
                      ? "border-red-400/45 bg-red-400/10 text-white shadow-[0_0_24px_rgba(239,68,68,0.09)]"
                      : "border-white/[0.07] bg-white/[0.02] text-zinc-400 hover:border-white/15 hover:text-white"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-black">{item.label}</span>
                    <span className="mt-1 block font-mono text-[9px] tracking-[2px] text-zinc-600 group-hover:text-red-400">{item.code}</span>
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${completed === item.indexes.length ? "bg-emerald-400/15 text-emerald-300" : "bg-white/5 text-zinc-500"}`}>
                    {completed}/{item.indexes.length}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-col gap-3 rounded-[24px] border border-white/10 bg-zinc-950/80 p-3 shadow-[0_22px_70px_rgba(0,0,0,0.34)] sm:flex-row sm:items-center">
            <label className="relative flex min-w-0 flex-1 items-center">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="absolute right-4 h-5 w-5 text-zinc-500">
                <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.7" />
                <path d="m16 16 4 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
              </svg>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ابحث داخل جميع القوانين..."
                className="w-full rounded-2xl border border-white/10 bg-black/55 py-3.5 pr-12 pl-4 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-red-400/45"
              />
            </label>
            <div className="flex shrink-0 items-center justify-between gap-3 px-2 text-xs text-zinc-500 sm:justify-end">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.85)]" />
              {query ? `${visibleRules.length} نتيجة` : activeCategory.label}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {visibleRules.map(({ index, rule }) => {
              const isReviewed = reviewed.includes(index);

              return (
                <button
                  key={rule}
                  type="button"
                  onClick={() => setRuleReviewed(index)}
                  className={`group relative min-h-44 overflow-hidden rounded-[26px] border p-5 text-right transition duration-300 hover:-translate-y-1 ${
                    isReviewed
                      ? "border-emerald-400/25 bg-emerald-400/[0.055]"
                      : "border-white/10 bg-gradient-to-br from-zinc-900/90 to-black hover:border-red-400/35"
                  }`}
                >
                  <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                  <div className="flex items-start justify-between gap-4">
                    <span className={`font-mono text-[10px] font-black tracking-[2px] ${isReviewed ? "text-emerald-300" : "text-red-400"}`}>
                      RULE {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs transition ${isReviewed ? "border-emerald-400/35 bg-emerald-400 text-black" : "border-white/15 text-transparent group-hover:border-red-400/40"}`}>
                      ✓
                    </span>
                  </div>
                  <p className="mt-5 text-base font-bold leading-8 text-zinc-100">{rule}</p>
                  <p className={`mt-4 text-[10px] font-black tracking-[2px] ${isReviewed ? "text-emerald-400" : "text-zinc-700"}`}>
                    {isReviewed ? "REVIEWED / تمت المراجعة" : "اضغط لتأكيد القراءة"}
                  </p>
                </button>
              );
            })}
          </div>

          {visibleRules.length === 0 && (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center">
              <p className="text-xl font-black text-white">ما لقينا قانون مطابق</p>
              <p className="mt-2 text-sm text-zinc-500">جرّب كلمة أقصر أو اختار تصنيفاً آخر.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

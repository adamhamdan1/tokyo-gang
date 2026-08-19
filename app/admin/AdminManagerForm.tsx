"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

type AdminPerson = {
  discordId: string;
  name: string;
  username: string | null;
  image: string | null;
};

type Props = {
  admins: AdminPerson[];
  candidates: AdminPerson[];
};

export function AdminManagerForm({ admins, candidates }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");

  const normalizedQuery = candidateQuery.trim().toLowerCase();
  const selectedCandidate = candidates.find((candidate) => candidate.discordId === selectedId) ?? null;
  const filteredCandidates = candidates.filter((candidate) => {
    if (!normalizedQuery) return true;

    return (
      candidate.name.toLowerCase().includes(normalizedQuery) ||
      candidate.username?.toLowerCase().includes(normalizedQuery)
    );
  });

  const updateAdmin = async (payload: { action: "ADD" | "REMOVE"; discordId: string }) => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل تحديث الإداريين");
        return false;
      }

      router.refresh();
      return true;
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tokyo-panel mb-8 p-5 md:mb-10 md:p-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black tracking-[5px] text-red-300">إدارة فريق الإدارة</p>
            <p className="mt-2 text-sm leading-7 text-gray-400">تظهر هنا فقط الحسابات التي تحمل رتبة TOKYO GANG حالياً، وتتحدث القائمة مباشرة من Discord.</p>
          </div>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black tracking-[2px] text-emerald-300">
            {candidates.length} مؤهل للإضافة
          </span>
        </div>
      </div>
      <form
        className="mt-5 flex flex-col gap-3 md:flex-row md:items-start"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!selectedId) return;

          const updated = await updateAdmin({ action: "ADD", discordId: selectedId });
          if (updated) {
            setSelectedId("");
            setCandidateQuery("");
            setPickerOpen(false);
          }
        }}
      >
        <div
          className="relative min-w-0 flex-1"
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setPickerOpen(false);
            }
          }}
        >
          <div className={`flex min-h-14 items-center gap-3 rounded-2xl border bg-black/70 px-3 transition ${pickerOpen ? "border-cyan-300/60 shadow-[0_0_0_3px_rgba(34,211,238,0.08),0_0_25px_rgba(34,211,238,0.06)]" : "border-white/15"}`}>
            {selectedCandidate?.image ? (
              <Image src={selectedCandidate.image} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-xl object-cover" />
            ) : (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-xs font-black text-red-300">
                {selectedCandidate?.name[0] ?? "#"}
              </span>
            )}
            <input
              type="text"
              role="combobox"
              aria-expanded={pickerOpen}
              aria-controls="admin-candidate-list"
              autoComplete="off"
              disabled={loading || candidates.length === 0}
              value={candidateQuery}
              onFocus={() => setPickerOpen(true)}
              onChange={(event) => {
                setCandidateQuery(event.target.value);
                setSelectedId("");
                setPickerOpen(true);
              }}
              placeholder={candidates.length > 0 ? "ابحث باسم عضو TOKYO الحالي..." : "لا يوجد أعضاء مؤهلون للإضافة"}
              className="min-w-0 flex-1 bg-transparent py-4 text-sm font-bold text-white outline-none placeholder:text-zinc-600 disabled:opacity-50"
            />
            <button
              type="button"
              aria-label={pickerOpen ? "إغلاق قائمة الحسابات" : "فتح قائمة الحسابات"}
              disabled={loading || candidates.length === 0}
              onClick={() => setPickerOpen((value) => !value)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 text-zinc-500 transition hover:text-white disabled:opacity-40 ${pickerOpen ? "rotate-180 bg-white/5" : ""}`}
            >
             ⌄
            </button>
          </div>

          {pickerOpen && candidates.length > 0 && (
            <div id="admin-candidate-list" role="listbox" className="tokyo-scrollbar absolute inset-x-0 top-[calc(100%+10px)] z-30 max-h-72 overflow-y-auto rounded-2xl border border-white/15 bg-[#050505]/[0.99] p-2 shadow-[0_25px_80px_rgba(0,0,0,0.75),0_0_30px_rgba(34,211,238,0.07)] backdrop-blur-2xl">
              <div className="mb-2 flex items-center justify-between border-b border-white/10 px-2 pb-2 text-[10px] font-black tracking-[2px] text-zinc-500">
                <span>أعضاء TOKYO الحاليون</span>
                <span className="text-cyan-300">{filteredCandidates.length} نتيجة</span>
              </div>
              <div className="grid gap-1">
                {filteredCandidates.map((candidate) => (
                  <button
                    key={candidate.discordId}
                    type="button"
                    role="option"
                    aria-selected={selectedId === candidate.discordId}
                    onClick={() => {
                      setSelectedId(candidate.discordId);
                      setCandidateQuery(candidate.name);
                      setPickerOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-right transition hover:border-white/10 hover:bg-white/[0.055]"
                  >
                    {candidate.image ? (
                      <Image src={candidate.image} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-xl object-cover" />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xs font-black text-white">{candidate.name[0] ?? "T"}</span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-white">{candidate.name}</span>
                      {candidate.username && <span className="mt-0.5 block truncate text-xs text-zinc-600">@{candidate.username}</span>}
                    </span>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
                  </button>
                ))}
                {filteredCandidates.length === 0 && (
                  <div className="px-4 py-8 text-center text-sm text-zinc-500">لا يوجد عضو حالي بهذا الاسم.</div>
                )}
              </div>
            </div>
          )}
        </div>
        <button disabled={loading || !selectedId} className="min-h-14 rounded-2xl bg-gradient-to-l from-red-300 to-red-400 px-7 py-3 font-black text-black shadow-[0_12px_32px_rgba(248,113,113,0.14)] transition hover:-translate-y-0.5 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-40">
          {loading ? "جاري التحديث..." : "إضافة إداري"}
        </button>
      </form>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {admins.map((person) => (
          <div key={person.discordId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 p-3">
            <div className="flex min-w-0 items-center gap-3">
              {person.image ? (
                <Image src={person.image} alt={person.name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 font-black text-white">
                  {person.name[0] ?? "إ"}
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-white">{person.name}</p>
                {person.username && <p className="truncate text-xs text-gray-500">@{person.username}</p>}
              </div>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => updateAdmin({ action: "REMOVE", discordId: person.discordId })}
              className="rounded-xl border border-red-400/30 px-3 py-2 text-xs font-black text-red-300 disabled:opacity-50"
            >
              إزالة
            </button>
          </div>
        ))}
        {admins.length === 0 && <p className="text-sm text-gray-500">لا يوجد إداريون إضافيون حالياً.</p>}
      </div>
    </section>
  );
}

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
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tokyo-panel mb-8 p-5 md:mb-10 md:p-6">
      <div>
        <p className="text-xs font-black tracking-[5px] text-red-300">إدارة فريق الإدارة</p>
        <p className="mt-2 text-sm leading-7 text-gray-400">اختر الحساب بالاسم؛ المعرّف يبقى محفوظاً داخلياً ولا يظهر في اللوحة.</p>
      </div>
      <form
        className="mt-5 flex flex-col gap-3 md:flex-row"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const discordId = String(formData.get("discordId") ?? "").trim();
          if (!discordId) return;
          updateAdmin({ action: "ADD", discordId });
          event.currentTarget.reset();
        }}
      >
        <select
          name="discordId"
          defaultValue=""
          disabled={loading || candidates.length === 0}
          className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black px-4 py-3 text-white outline-none focus:border-red-300 disabled:opacity-50"
        >
          <option value="" disabled>
            {candidates.length > 0 ? "اختر الحساب الذي تريد إضافته" : "لا يوجد حسابات متاحة للإضافة"}
          </option>
          {candidates.map((candidate) => (
            <option key={candidate.discordId} value={candidate.discordId}>
              {candidate.name}{candidate.username && candidate.username !== candidate.name ? ` — @${candidate.username}` : ""}
            </option>
          ))}
        </select>
        <button disabled={loading || candidates.length === 0} className="rounded-2xl bg-red-300 px-6 py-3 font-black text-black disabled:opacity-50">
          إضافة إداري
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

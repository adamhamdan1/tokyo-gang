"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  admins: string[];
};

export function AdminManagerForm({ admins }: Props) {
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
    <section className="mb-8 rounded-2xl border border-red-400/20 bg-red-500/10 p-5 md:mb-10 md:rounded-3xl md:p-6">
      <p className="text-xs font-black tracking-[5px] text-red-300">OWNER ADMIN CONTROL</p>
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
        <input
          name="discordId"
          placeholder="Discord ID للإداري الجديد"
          className="min-w-0 flex-1 rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none"
        />
        <button disabled={loading} className="rounded-2xl bg-red-300 px-6 py-3 font-black text-black disabled:opacity-50">
          إضافة إداري
        </button>
      </form>
      <div className="mt-5 grid gap-2 md:grid-cols-2">
        {admins.map((discordId) => (
          <div key={discordId} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/35 p-3">
            <span className="break-all text-sm text-gray-300">{discordId}</span>
            <button
              type="button"
              disabled={loading}
              onClick={() => updateAdmin({ action: "REMOVE", discordId })}
              className="rounded-xl border border-red-400/30 px-3 py-2 text-xs font-black text-red-300 disabled:opacity-50"
            >
              إزالة
            </button>
          </div>
        ))}
        {admins.length === 0 && <p className="text-sm text-gray-500">ما في إداريين إضافيين حالياً.</p>}
      </div>
    </section>
  );
}

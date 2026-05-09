"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminAlertForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
          const form = event.currentTarget;
          const data = new FormData(form);
          const response = await fetch("/api/admin/alerts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: data.get("title"),
              message: data.get("message"),
              durationMinutes: Number(data.get("durationMinutes")),
            }),
          });
          const result = await response.json().catch(() => null);

          if (!response.ok) {
            alert(result?.error ?? "فشل إرسال التنبيه");
            return;
          }

          alert("تم تفعيل تنبيه TOKYO على الموقع");
          form.reset();
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      className="mb-8 grid gap-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-5 shadow-[0_0_35px_rgba(239,68,68,0.10)] md:mb-10 md:rounded-3xl md:p-6"
    >
      <p className="text-xs font-black tracking-[5px] text-red-300">TOKYO ALERT BROADCAST</p>
      <div className="grid gap-3 md:grid-cols-[1fr_140px]">
        <input name="title" required placeholder="عنوان التنبيه" className="rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none" />
        <input name="durationMinutes" type="number" min="5" defaultValue="60" className="rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none" />
      </div>
      <textarea name="message" required placeholder="نص التنبيه الذي سيظهر على الموقع" className="h-24 rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none" />
      <button disabled={loading} className="rounded-2xl bg-red-500 px-6 py-3 font-black text-white disabled:opacity-50">
        {loading ? "جاري البث..." : "تفعيل التنبيه"}
      </button>
    </form>
  );
}

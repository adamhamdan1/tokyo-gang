"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ActiveAlert = {
  id: string;
  title: string;
  message: string;
  expiresLabel: string | null;
};

export function AdminAlertForm({ activeAlerts }: { activeAlerts: ActiveAlert[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  const dismissAlert = async (alertId: string, title: string) => {
    if (!confirm(`إيقاف تنبيه «${title}» وإزالته من الموقع؟`)) return;

    setDismissingId(alertId);

    try {
      const response = await fetch(`/api/admin/alerts/${alertId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل إيقاف التنبيه");
        return;
      }

      router.refresh();
    } finally {
      setDismissingId(null);
    }
  };

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-[5px] text-red-300">TOKYO ALERT BROADCAST</p>
          <h3 className="mt-2 text-xl font-black text-white">إدارة شريط التنبيه</h3>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-black ${activeAlerts.length ? "border-red-400/30 bg-red-400/10 text-red-200" : "border-green-400/30 bg-green-400/10 text-green-200"}`}>
          {activeAlerts.length ? `${activeAlerts.length} نشط` : "لا يوجد تنبيه نشط"}
        </span>
      </div>

      {activeAlerts.length > 0 && (
        <div className="grid gap-3" aria-live="polite">
          {activeAlerts.map((activeAlert) => (
            <article key={activeAlert.id} className="rounded-2xl border border-red-400/25 bg-black/55 p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
              <div className="min-w-0">
                <p className="font-black text-white">{activeAlert.title}</p>
                <p className="mt-1 truncate text-sm text-zinc-400">{activeAlert.message}</p>
                <p className="mt-2 font-mono text-[10px] tracking-[0.14em] text-zinc-600">
                  {activeAlert.expiresLabel ? `ينتهي ${activeAlert.expiresLabel}` : "بدون وقت انتهاء"}
                </p>
              </div>
              <button
                type="button"
                disabled={dismissingId === activeAlert.id}
                onClick={() => dismissAlert(activeAlert.id, activeAlert.title)}
                className="mt-4 w-full shrink-0 rounded-xl border border-red-400/35 bg-red-500/10 px-4 py-2.5 text-sm font-black text-red-200 transition hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-50 sm:mt-0 sm:w-auto"
              >
                {dismissingId === activeAlert.id ? "جاري الإيقاف..." : "إيقاف وإزالة"}
              </button>
            </article>
          ))}
        </div>
      )}

      <div className="my-1 h-px bg-white/10" />
      <p className="text-sm font-black text-white">بث تنبيه جديد</p>
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

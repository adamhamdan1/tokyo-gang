"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LeaveRequestForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        const response = await fetch("/api/leave", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason: formData.get("reason"),
            durationDays: Number(formData.get("durationDays")),
            startsAt: formData.get("startsAt"),
          }),
        });
        const result = await response.json().catch(() => null);

        setLoading(false);

        if (!response.ok) {
          setMessage({ type: "error", text: result?.error ?? "فشل إرسال طلب الإجازة" });
          return;
        }

        form.reset();
        setMessage({ type: "success", text: "تم إرسال طلب الإجازة للإدارة." });
        router.refresh();
      }}
      className="grid gap-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-6 shadow-[0_0_35px_rgba(16,185,129,0.10)]"
    >
      <p className="text-xs font-black tracking-[5px] text-emerald-300">LEAVE REQUEST</p>
      <h2 className="text-3xl font-black text-white">طلب إجازة</h2>
      <textarea
        name="reason"
        required
        minLength={5}
        placeholder="سبب الإجازة"
        className="h-28 rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none"
      />
      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="durationDays"
          type="number"
          min="1"
          required
          placeholder="المدة بالأيام"
          className="rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none"
        />
        <input
          name="startsAt"
          type="datetime-local"
          className="rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none"
        />
      </div>
      {message && (
        <p className={`rounded-2xl border p-4 text-sm font-black ${message.type === "success" ? "border-emerald-400/30 text-emerald-200" : "border-red-500/30 text-red-300"}`}>
          {message.text}
        </p>
      )}
      <button disabled={loading} className="rounded-2xl bg-emerald-300 px-5 py-4 font-black text-black transition hover:bg-white disabled:opacity-50">
        {loading ? "جاري الإرسال..." : "إرسال الطلب"}
      </button>
    </form>
  );
}

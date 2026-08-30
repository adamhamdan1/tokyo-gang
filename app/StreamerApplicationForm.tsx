"use client";

import { useState } from "react";

export function StreamerApplicationForm() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  return (
    <form
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage(null);
        const form = event.currentTarget;
        const data = new FormData(form);

        try {
          const response = await fetch("/api/streamer-apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: data.get("name"),
              age: data.get("age"),
              platform: data.get("platform"),
              channelUrl: data.get("channelUrl"),
              experience: data.get("experience"),
              availability: data.get("availability"),
              hasMic: data.get("hasMic") === "on",
              acceptedRules: data.get("acceptedRules") === "on",
            }),
          });
          const result = (await response.json().catch(() => null)) as { error?: string } | null;
          if (!response.ok) throw new Error(result?.error || "تعذر إرسال تقديم الستريمر");
          setMessage({ type: "success", text: "تم إرسال تقديمك لفريق الستريمرز. تقدر تتابع القرار من صفحة حالة الطلب." });
          form.reset();
        } catch (error) {
          setMessage({ type: "error", text: error instanceof Error ? error.message : "تعذر إرسال تقديم الستريمر" });
        } finally {
          setBusy(false);
        }
      }}
    >
      {message && (
        <div className={`rounded-2xl border p-4 text-center font-black ${message.type === "success" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" : "border-red-400/25 bg-red-400/10 text-red-200"}`}>
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-zinc-300">
          اسمك أو اسم الشهرة
          <input name="name" required maxLength={80} className="rounded-2xl border border-white/15 bg-black/60 px-4 py-4 text-white outline-none focus:border-[#53fc18]/60" placeholder="مثال: Adam Cruz" />
        </label>
        <label className="grid gap-2 text-sm font-black text-zinc-300">
          العمر
          <input name="age" required type="number" min={16} max={99} className="rounded-2xl border border-white/15 bg-black/60 px-4 py-4 text-white outline-none focus:border-[#53fc18]/60" placeholder="16+" />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-black text-zinc-300">
          منصة البث الأساسية
          <select name="platform" required className="rounded-2xl border border-white/15 bg-black/60 px-4 py-4 text-white outline-none focus:border-[#53fc18]/60">
            <option value="">اختر المنصة</option>
            <option value="Kick">Kick</option>
            <option value="Twitch">Twitch</option>
            <option value="YouTube">YouTube</option>
            <option value="TikTok">TikTok</option>
            <option value="Multi-platform">أكثر من منصة</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-black text-zinc-300">
          رابط القناة
          <input name="channelUrl" required type="url" maxLength={300} className="rounded-2xl border border-white/15 bg-black/60 px-4 py-4 text-left text-white outline-none focus:border-[#53fc18]/60" dir="ltr" placeholder="https://kick.com/username" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-black text-zinc-300">
        خبرتك وأرقامك ونوع المحتوى
        <textarea name="experience" required minLength={20} maxLength={1000} className="min-h-36 rounded-2xl border border-white/15 bg-black/60 px-4 py-4 font-normal leading-8 text-white outline-none focus:border-[#53fc18]/60" placeholder="احكيلنا عن خبرتك، متوسط المشاهدات، ونوع المحتوى..." />
      </label>

      <label className="grid gap-2 text-sm font-black text-zinc-300">
        أوقات البث والتفرغ
        <textarea name="availability" required minLength={10} maxLength={500} className="min-h-28 rounded-2xl border border-white/15 bg-black/60 px-4 py-4 font-normal leading-8 text-white outline-none focus:border-[#53fc18]/60" placeholder="كم يوم بالأسبوع وكم ساعة تقدر تبث؟" />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-bold text-zinc-300">
          <input name="hasMic" type="checkbox" required className="h-5 w-5 accent-[#53fc18]" />
          عندي مايك واضح ومناسب للبث
        </label>
        <label className="flex items-start gap-3 rounded-2xl border border-[#53fc18]/15 bg-[#53fc18]/[0.05] p-4 font-bold leading-7 text-zinc-300">
          <input name="acceptedRules" type="checkbox" required className="mt-1 h-5 w-5 accent-[#53fc18]" />
          أوافق على تمثيل TOKYO باحترام والالتزام بتعليمات فريق المحتوى
        </label>
      </div>

      <button disabled={busy} className="rounded-2xl bg-[#53fc18] px-6 py-4 text-lg font-black text-black shadow-[0_0_35px_rgba(83,252,24,0.18)] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-wait disabled:opacity-50">
        {busy ? "جاري إرسال الملف..." : "إرسال تقديم Streamer"}
      </button>
    </form>
  );
}

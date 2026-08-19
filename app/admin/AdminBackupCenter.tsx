"use client";

import { useRef, useState } from "react";

type RestoreResult = {
  restoredSettings: number;
  restoredAnnouncements: number;
  restoredAlerts: number;
};

export function AdminBackupCenter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const exportBackup = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/backup", { cache: "no-store" });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error || "تعذر إنشاء النسخة الاحتياطية");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") ?? "";
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] ?? `tokyo-safe-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setMessage("تم تنزيل نسخة احتياطية آمنة بدون أسرار أو صلاحيات إدارية.");
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "تعذر إنشاء النسخة الاحتياطية");
    } finally {
      setBusy(false);
    }
  };

  const restoreBackup = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 300_000) {
      setError("حجم ملف النسخة الاحتياطية أكبر من المسموح.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const backup = JSON.parse(await file.text()) as unknown;
      const confirmed = window.confirm("سيتم دمج الإعدادات والإعلانات مع البيانات الحالية بدون حذفها. هل تريد المتابعة؟");
      if (!confirmed) return;
      const response = await fetch("/api/admin/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backup }),
      });
      const data = (await response.json().catch(() => null)) as (RestoreResult & { error?: string }) | null;
      if (!response.ok || !data) throw new Error(data?.error || "تعذر استرجاع النسخة الاحتياطية");
      setMessage(`تم الاسترجاع: ${data.restoredSettings} إعدادات، ${data.restoredAnnouncements} إعلانات، ${data.restoredAlerts} تنبيهات.`);
      window.setTimeout(() => window.location.reload(), 1200);
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "ملف النسخة الاحتياطية غير صالح");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="relative mb-8 overflow-hidden rounded-[28px] border border-cyan-400/20 bg-gradient-to-l from-cyan-400/[0.08] via-zinc-950 to-zinc-950 p-5 md:mb-10 md:p-7">
      <div className="pointer-events-none absolute -left-16 top-0 h-44 w-44 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-black tracking-[4px] text-cyan-300">SAFE BACKUP VAULT</p>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[9px] font-black text-emerald-300">OWNER ONLY</span>
          </div>
          <h3 className="mt-3 text-2xl font-black text-white">خزنة النسخة الاحتياطية</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
            تحفظ محتوى الموقع، إعدادات الرتب وأرقام القنوات والإعلانات. كلمات السر، روابط Webhook وصلاحيات الإدارة لا تدخل بالملف نهائياً.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
          <button type="button" disabled={busy} onClick={exportBackup} className="rounded-2xl bg-cyan-300 px-6 py-3.5 font-black text-black transition hover:bg-white disabled:cursor-wait disabled:opacity-50">
            {busy ? "جاري التجهيز..." : "تنزيل نسخة آمنة"}
          </button>
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className="rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 font-black text-white transition hover:border-white/30 hover:bg-white/10 disabled:cursor-wait disabled:opacity-50">
            استرجاع من ملف
          </button>
          <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={(event) => void restoreBackup(event.target.files?.[0])} />
        </div>
      </div>
      {message && <p className="relative mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-bold text-emerald-200">{message}</p>}
      {error && <p className="relative mt-5 rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">{error}</p>}
    </section>
  );
}

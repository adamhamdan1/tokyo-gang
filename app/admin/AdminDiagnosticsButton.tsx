"use client";

import { useState } from "react";

export function AdminDiagnosticsButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, string | number | undefined> | null>(null);
  const [message, setMessage] = useState("");

  const runDiagnostics = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/diagnostics");
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.error ?? "فشل التشخيص");
        return;
      }

      setResult(result);
      setMessage(result.error ? "اكتمل الفحص مع ملاحظة تحتاج متابعة" : "جميع الخدمات الأساسية اجتازت الفحص");
    } catch {
      setMessage("تعذر الوصول إلى خدمة التشخيص");
    } finally {
      setLoading(false);
    }
  };

  const checks = result
    ? [
        ["Discord Bot", result.bot],
        ["Discord Server", result.guild],
        ["رتبة القبول", result.acceptedRole],
        ["رتبة TOKYO", result.tokyoRole],
        ["رتب التحذير", `${result.warningRoles ?? 0} / 3`],
        ["Online Widget", result.widget],
        ["قاعدة البيانات", result.database],
      ]
    : [];

  return (
    <>
      <button
        type="button"
        disabled={loading}
        onClick={runDiagnostics}
        className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-300 hover:text-black disabled:opacity-50"
      >
        {loading ? "جاري فحص كل الخدمات..." : result ? "إعادة فحص النظام" : "فحص صحة النظام"}
      </button>

      {(result || message) && (
        <div className="basis-full rounded-2xl border border-cyan-400/20 bg-black/45 p-4 lg:mt-1 lg:w-full">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black tracking-[3px] text-cyan-300">SYSTEM HEALTH REPORT</p>
              <p className={`mt-1 text-xs ${result?.error || !result ? "text-yellow-300" : "text-emerald-300"}`}>{message}</p>
            </div>
            <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] font-black text-zinc-500">LIVE CHECK</span>
          </div>
          {checks.length > 0 && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {checks.map(([label, value]) => {
                const valueText = String(value ?? "UNKNOWN");
                const healthy = !/ERROR|UNKNOWN|0 \/ 3/i.test(valueText);
                return (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
                    <p className="text-[9px] font-black tracking-[2px] text-zinc-600">{label}</p>
                    <p dir="auto" className={`mt-2 truncate text-xs font-black ${healthy ? "text-emerald-300" : "text-yellow-300"}`} title={valueText}>{valueText}</p>
                  </div>
                );
              })}
            </div>
          )}
          {result?.error && <p className="mt-3 rounded-xl border border-yellow-400/15 bg-yellow-400/[0.06] p-3 text-xs leading-6 text-yellow-200">{result.error}</p>}
        </div>
      )}
    </>
  );
}

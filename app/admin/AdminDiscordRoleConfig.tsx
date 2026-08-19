"use client";

import { TOKYO_ROLE_OPTIONS } from "@/lib/tokyo-content";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const operationalRoles = [
  { key: "TOKYO_GANG", label: "أعضاء العصابة", description: "الرتبة التي تحدد من يظهر في قاعدة أعضاء TOKYO" },
  { key: "ACCEPTED", label: "القبول", description: "تُعطى عند قبول التقديم" },
  { key: "TRIAL", label: "فترة التجربة", description: "تُعطى لطلبات التجربة" },
  { key: "SUMMON", label: "الاستدعاء", description: "تُعطى عند استدعاء العضو" },
  { key: "WARNING", label: "التحذير العادي", description: "رتبة التحذير الأول" },
  { key: "STRONG_WARNING", label: "التحذير القوي", description: "رتبة التحذير المشدد" },
  { key: "DISMISSAL", label: "الفصل", description: "تُعطى عند فصل العضو" },
  { key: "ON_LEAVE", label: "الإجازة", description: "تُعطى عند قبول الإجازة" },
  { key: "RANK_MEMBER", label: "الرتبة الداخلية: عضو", description: "رتبة MEMBER في نظام الترقيات" },
  { key: "RANK_SENIOR", label: "الرتبة الداخلية: مسؤول", description: "رتبة SENIOR في نظام الترقيات" },
  { key: "RANK_OFFICER", label: "الرتبة الداخلية: مشرف", description: "رتبة OFFICER في نظام الترقيات" },
  { key: "RANK_DEPUTY", label: "الرتبة الداخلية: نائب", description: "رتبة DEPUTY في نظام الترقيات" },
  { key: "RANK_LEADER", label: "الرتبة الداخلية: قيادة", description: "رتبة LEADER في نظام الترقيات" },
];

const allRoles = [
  ...operationalRoles,
  ...TOKYO_ROLE_OPTIONS.filter((role) => !operationalRoles.some((item) => item.key === role.key)).map((role) => ({
    key: role.key,
    label: role.label,
    description: role.discordName,
  })),
];

type Props = {
  initialOverrides: Record<string, string>;
  currentMemberCount: number;
};

export function AdminDiscordRoleConfig({ initialOverrides, currentMemberCount }: Props) {
  const router = useRouter();
  const [overrides, setOverrides] = useState(initialOverrides);
  const [roleKey, setRoleKey] = useState("TOKYO_GANG");
  const [roleId, setRoleId] = useState(initialOverrides.TOKYO_GANG ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const selectedRole = useMemo(() => allRoles.find((role) => role.key === roleKey), [roleKey]);

  const selectRole = (nextKey: string) => {
    setRoleKey(nextKey);
    setRoleId(overrides[nextKey] ?? "");
    setMessage("");
  };

  const save = async (nextRoleId: string) => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/tokyo-role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleKey, roleId: nextRoleId }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.error ?? "فشل حفظ الرتبة");
        return;
      }

      setOverrides((current) => {
        const next = { ...current };
        if (nextRoleId) next[roleKey] = nextRoleId;
        else delete next[roleKey];
        return next;
      });
      setRoleId(nextRoleId);
      setMessage(
        nextRoleId
          ? `تم ربط ${selectedRole?.label} مع ${result.roleName}${result.memberCount === null ? "" : ` (${result.memberCount} عضو)`}`
          : `تم حذف التثبيت اليدوي لرتبة ${selectedRole?.label}`
      );
      router.refresh();
    } catch {
      setMessage("تعذر الاتصال بخدمة إعداد الرتب");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tokyo-glass mb-8 rounded-2xl border-cyan-400/20 p-5 md:mb-10 md:rounded-3xl md:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[4px] text-cyan-300">DISCORD ROLE SETUP</p>
          <h3 className="mt-3 text-2xl font-black text-white">الإعداد الأولي وإصلاح رتب Discord</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-400">
            ضع كل Role ID مرة واحدة فقط. تُحفظ الإعدادات في قاعدة البيانات ويستخدمها الموقع تلقائياً، ولا تحتاج الرجوع هنا إلا عند تغيير الرتب داخل Discord أو حدوث عطل.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-xs font-black text-green-300">
            {currentMemberCount} عضو
          </span>
          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-300">
            {Object.keys(overrides).length} إعداد محفوظ
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-[0.8fr_1.2fr_auto_auto]">
        <select
          value={roleKey}
          onChange={(event) => selectRole(event.target.value)}
          className="rounded-2xl border border-white/15 bg-black/70 px-4 py-3 text-sm font-black text-white outline-none"
        >
          {allRoles.map((role) => (
            <option key={role.key} value={role.key}>{role.label}</option>
          ))}
        </select>
        <input
          value={roleId}
          onChange={(event) => setRoleId(event.target.value.replace(/\D/g, ""))}
          placeholder="الصق Role ID هنا"
          inputMode="numeric"
          className="min-w-0 rounded-2xl border border-white/15 bg-black/50 px-5 py-3 font-mono text-sm text-white outline-none transition focus:border-cyan-400/50"
        />
        <button
          type="button"
          disabled={loading || !roleId}
          onClick={() => void save(roleId)}
          className="rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "جاري الفحص..." : "فحص وحفظ"}
        </button>
        <button
          type="button"
          disabled={loading || !overrides[roleKey]}
          onClick={() => void save("")}
          className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-black text-gray-300 transition hover:border-red-400/30 hover:text-red-300 disabled:opacity-40"
        >
          حذف الإعداد
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <p className="text-gray-500">{selectedRole?.description}</p>
        <p className={message.startsWith("تم") ? "text-green-300" : "text-red-300"} aria-live="polite">{message}</p>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {operationalRoles.map((role) => (
          <button
            type="button"
            key={role.key}
            onClick={() => selectRole(role.key)}
            className={`rounded-2xl border p-3 text-right transition ${
              roleKey === role.key ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-black/30 hover:border-white/20"
            }`}
          >
            <span className="block text-sm font-black text-white">{role.label}</span>
            <span className={`mt-1 block text-[10px] ${overrides[role.key] ? "text-green-300" : "text-gray-600"}`}>
              {overrides[role.key] ? "محفوظ في قاعدة البيانات" : "يستخدم الإعداد التلقائي"}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

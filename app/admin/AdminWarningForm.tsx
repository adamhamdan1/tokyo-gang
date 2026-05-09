"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  memberId: string;
};

export function AdminWarningForm({ memberId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const submitWarning = async (formData: FormData) => {
    const reason = String(formData.get("reason") ?? "").trim();
    const severity = String(formData.get("severity") ?? "NORMAL");
    const details = String(formData.get("details") ?? "").trim();

    if (!reason) {
      alert("اكتب سبب التحذير");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/members/${memberId}/warnings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason, severity, details }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل إصدار التحذير");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={submitWarning} className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5 md:rounded-3xl md:p-6">
      <p className="text-xs font-black tracking-[5px] text-yellow-300">WARNING CENTER</p>
      <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">إصدار تحذير</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <select
          name="severity"
          className="rounded-2xl border border-white/15 bg-black/50 px-5 py-4 outline-none"
          disabled={loading}
        >
          <option value="NORMAL">تحذير عادي</option>
          <option value="HIGH">تحذير قوي</option>
          <option value="DISMISSAL">فصل</option>
        </select>
        <input
          name="reason"
          required
          placeholder="سبب التحذير"
          className="rounded-2xl border border-white/15 bg-black/50 px-5 py-4 outline-none"
          disabled={loading}
        />
      </div>
      <textarea
        name="details"
        placeholder="تفاصيل إضافية"
        className="mt-4 h-28 w-full rounded-2xl border border-white/15 bg-black/50 px-5 py-4 outline-none"
        disabled={loading}
      />
      <button
        disabled={loading}
        className="mt-5 w-full rounded-2xl bg-yellow-400 px-7 py-3 font-black text-black transition hover:bg-yellow-300 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "جاري التحذير..." : "إرسال التحذير"}
      </button>
    </form>
  );
}

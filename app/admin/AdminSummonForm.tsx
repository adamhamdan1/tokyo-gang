"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type TokyoMemberOption = {
  id: string;
  displayName: string;
  username: string;
  discordId: string;
};

type Props = {
  members: TokyoMemberOption[];
};

export function AdminSummonForm({ members }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const createSummon = async (formData: FormData) => {
    const memberId = String(formData.get("memberId") ?? "");
    const reason = String(formData.get("reason") ?? "").trim();
    const details = String(formData.get("details") ?? "").trim();

    if (!memberId || !reason) {
      alert("اختار العضو واكتب سبب الاستدعاء");
      return;
    }

    if (!confirm("متأكد بدك تستدعي العضو؟ رح تنسحب رتبة TOKYO وينعطى رتبة الاستدعاء.")) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/admin/summons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId, reason, details }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل إنشاء الاستدعاء");
        return;
      }

      alert("تم استدعاء العضو وإرسال الرسائل");
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={createSummon} className="mb-10 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-6 shadow-[0_0_35px_rgba(34,211,238,0.08)]">
      <div className="mb-5">
        <p className="text-xs font-black tracking-[5px] text-cyan-300">TOKYO SUMMON SYSTEM</p>
        <h2 className="mt-2 text-3xl font-black text-white">استدعاء عضو من العصابة</h2>
        <p className="mt-2 text-sm text-gray-400">
          ينسحب من العضو رتبة TOKYO، وينعطى رتبة الاستدعاء، وتوصله رسالة خاصة ورسالة في روم الاستدعاء.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          name="memberId"
          required
          className="rounded-2xl border border-white/15 bg-black/50 px-5 py-4 outline-none"
          disabled={members.length === 0 || loading}
        >
          <option value="">اختار عضو من TOKYO</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName} - @{member.username}
            </option>
          ))}
        </select>

        <input
          name="reason"
          required
          placeholder="سبب الاستدعاء"
          className="rounded-2xl border border-white/15 bg-black/50 px-5 py-4 outline-none"
          disabled={loading}
        />
      </div>

      <textarea
        name="details"
        placeholder="تفاصيل إضافية أو تعليمات للعضو"
        className="mt-4 h-28 w-full rounded-2xl border border-white/15 bg-black/50 px-5 py-4 outline-none"
        disabled={loading}
      />

      {members.length === 0 && (
        <p className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-bold text-yellow-200">
          لا يوجد أعضاء في قاعدة TOKYO حالياً. المزامنة تلقائية، جرب تحديث الصفحة بعد لحظات.
        </p>
      )}

      <button
        disabled={loading || members.length === 0}
        className="mt-5 rounded-2xl bg-cyan-400 px-7 py-3 font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "جاري الاستدعاء..." : "استدعاء العضو"}
      </button>
    </form>
  );
}

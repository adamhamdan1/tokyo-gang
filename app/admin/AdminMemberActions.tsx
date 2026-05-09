"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  memberId: string;
  currentRank: string;
  currentScore: number;
};

export function AdminMemberActions({ memberId, currentRank, currentScore }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const sendAction = async (payload: Record<string, unknown>) => {
    setLoading(String(payload.action));

    try {
      const response = await fetch(`/api/admin/members/${memberId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل تنفيذ الإجراء");
        return;
      }

      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  const changeRank = (formData: FormData) => {
    sendAction({
      action: "RANK",
      rank: formData.get("rank"),
      reason: formData.get("reason"),
    });
  };

  const addNote = (formData: FormData) => {
    sendAction({
      action: "NOTE",
      note: formData.get("note"),
    });
  };

  const updateScore = (formData: FormData) => {
    sendAction({
      action: "SCORE",
      score: Number(formData.get("score")),
      reason: formData.get("reason"),
    });
  };

  const addLeave = (formData: FormData) => {
    sendAction({
      action: "LEAVE",
      reason: formData.get("reason"),
      startsAt: formData.get("startsAt"),
      endsAt: formData.get("endsAt"),
      durationDays: Number(formData.get("durationDays")),
    });
  };

  const blacklist = () => {
    const reason = prompt("سبب البلاك ليست")?.trim();
    if (!reason) return;
    if (!confirm("متأكد؟ سيتم سحب رتبة TOKYO ووضع العضو في البلاك ليست.")) return;
    sendAction({ action: "BLACKLIST", reason });
  };

  return (
    <section className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5 md:rounded-3xl md:p-6">
      <p className="text-xs font-black tracking-[5px] text-cyan-300">MEMBER CONTROL</p>
      <div className="mt-5 grid gap-5">
        <form action={changeRank} className="grid gap-3 rounded-2xl border border-white/10 bg-black/35 p-4">
          <p className="font-black text-white">ترقية / تنزيل رتبة</p>
          <select name="rank" defaultValue={currentRank} className="rounded-xl border border-white/15 bg-black px-4 py-3 outline-none">
            <option value="MEMBER">عضو</option>
            <option value="SENIOR">مسؤول</option>
            <option value="OFFICER">مشرف</option>
            <option value="DEPUTY">نائب</option>
            <option value="LEADER">قيادة</option>
          </select>
          <input name="reason" placeholder="سبب التغيير" className="rounded-xl border border-white/15 bg-black px-4 py-3 outline-none" />
          <button disabled={loading === "RANK"} className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-black disabled:opacity-50">
            حفظ الرتبة
          </button>
        </form>

        <form action={updateScore} className="grid gap-3 rounded-2xl border border-white/10 bg-black/35 p-4">
          <p className="font-black text-white">تقييم العضو</p>
          <input name="score" type="number" min="0" max="100" defaultValue={currentScore} className="rounded-xl border border-white/15 bg-black px-4 py-3 outline-none" />
          <input name="reason" placeholder="سبب تعديل التقييم" className="rounded-xl border border-white/15 bg-black px-4 py-3 outline-none" />
          <button disabled={loading === "SCORE"} className="rounded-xl bg-white px-5 py-3 font-black text-black disabled:opacity-50">
            تحديث التقييم
          </button>
        </form>

        <form action={addNote} className="grid gap-3 rounded-2xl border border-white/10 bg-black/35 p-4">
          <p className="font-black text-white">ملاحظة إدارية خاصة</p>
          <textarea name="note" required placeholder="اكتب ملاحظة لا تظهر للعضو" className="h-24 rounded-xl border border-white/15 bg-black px-4 py-3 outline-none" />
          <button disabled={loading === "NOTE"} className="rounded-xl bg-yellow-300 px-5 py-3 font-black text-black disabled:opacity-50">
            إضافة ملاحظة
          </button>
        </form>

        <form action={addLeave} className="grid gap-3 rounded-2xl border border-white/10 bg-black/35 p-4">
          <p className="font-black text-white">تسجيل إجازة</p>
          <input name="reason" required placeholder="سبب الإجازة" className="rounded-xl border border-white/15 bg-black px-4 py-3 outline-none" />
          <div className="grid gap-3 md:grid-cols-2">
            <input name="durationDays" type="number" min="1" placeholder="المدة بالأيام مثل 3" className="rounded-xl border border-white/15 bg-black px-4 py-3 outline-none" />
            <input name="startsAt" type="datetime-local" className="rounded-xl border border-white/15 bg-black px-4 py-3 outline-none" />
            <input name="endsAt" type="datetime-local" className="rounded-xl border border-white/15 bg-black px-4 py-3 outline-none" />
          </div>
          <p className="text-xs text-gray-500">إذا كتبت مدة بالأيام، النظام يحسب وقت الانتهاء تلقائياً ويشيل رتبة الإجازة بعد انتهاء المدة.</p>
          <button disabled={loading === "LEAVE"} className="rounded-xl bg-green-300 px-5 py-3 font-black text-black disabled:opacity-50">
            تسجيل الإجازة
          </button>
        </form>

        <button
          type="button"
          onClick={blacklist}
          disabled={loading === "BLACKLIST"}
          className="rounded-2xl bg-red-600 px-6 py-4 font-black text-white disabled:opacity-50"
        >
          إضافة للبلاك ليست
        </button>
      </div>
    </section>
  );
}

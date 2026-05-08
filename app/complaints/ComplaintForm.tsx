"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type MemberOption = {
  id: string;
  displayName: string;
  username: string;
};

type Props = {
  members: MemberOption[];
};

const categories = [
  "مخالفة قوانين",
  "إهانة أو قلة احترام",
  "تخريب أو تهور",
  "تسريب معلومات",
  "عدم التزام بأوامر القيادة",
  "أخرى",
];

export function ComplaintForm({ members }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const submitComplaint = async (formData: FormData) => {
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch("/api/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          accusedId: formData.get("accusedId"),
          category: formData.get("category"),
          reason: formData.get("reason"),
          evidenceUrl: formData.get("evidenceUrl"),
          details: formData.get("details"),
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage({ type: "error", text: result?.error ?? "فشل إرسال الشكوى" });
        return;
      }

      setMessage({ type: "success", text: "تم إرسال الشكوى للإدارة بنجاح" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={submitComplaint} className="mx-auto grid max-w-3xl gap-5 rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-[0_0_45px_rgba(255,255,255,0.06)]">
      {message && (
        <div
          className={`rounded-2xl border p-4 text-center font-black ${
            message.type === "success"
              ? "border-green-400/30 bg-green-400/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <select name="accusedId" required disabled={loading} className="rounded-2xl border border-white/15 bg-black px-5 py-4 outline-none">
          <option value="">اختار العضو المشكو عليه</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName} - @{member.username}
            </option>
          ))}
        </select>

        <select name="category" required disabled={loading} className="rounded-2xl border border-white/15 bg-black px-5 py-4 outline-none">
          <option value="">نوع الشكوى</option>
          {categories.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
      </div>

      <input
        name="reason"
        required
        minLength={8}
        placeholder="سبب الشكوى باختصار"
        disabled={loading}
        className="rounded-2xl border border-white/15 bg-black px-5 py-4 outline-none"
      />

      <input
        name="evidenceUrl"
        type="url"
        placeholder="رابط تصوير / صورة / كليب اختياري"
        disabled={loading}
        className="rounded-2xl border border-white/15 bg-black px-5 py-4 outline-none"
      />

      <textarea
        name="details"
        placeholder="تفاصيل إضافية للإدارة"
        disabled={loading}
        className="h-32 rounded-2xl border border-white/15 bg-black px-5 py-4 outline-none"
      />

      <button disabled={loading} className="rounded-2xl bg-white px-6 py-4 font-black text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50">
        {loading ? "جاري إرسال الشكوى..." : "إرسال الشكوى"}
      </button>
    </form>
  );
}

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

export function AdminSpotlightForm({ members }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);

        try {
          const formData = new FormData(event.currentTarget);
          const response = await fetch("/api/admin/spotlight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId: formData.get("memberId") }),
          });
          const result = await response.json().catch(() => null);

          if (!response.ok) {
            alert(result?.error ?? "فشل تحديد عضو spotlight");
            return;
          }

          alert("تم تحديد عضو Spotlight");
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      className="mb-8 grid gap-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-5 shadow-[0_0_35px_rgba(250,204,21,0.08)] md:mb-10 md:rounded-3xl md:p-6"
    >
      <p className="text-xs font-black tracking-[5px] text-yellow-300">MEMBER SPOTLIGHT CONTROL</p>
      <select name="memberId" required className="rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none">
        <option value="">اختار عضو يظهر بالـ Spotlight</option>
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName} - @{member.username}
          </option>
        ))}
      </select>
      <button disabled={loading} className="rounded-2xl bg-yellow-300 px-6 py-3 font-black text-black disabled:opacity-50">
        {loading ? "جاري الحفظ..." : "تحديد Spotlight"}
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  complaintId: string;
};

export function AdminComplaintVote({ complaintId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const vote = async (nextVote: "FOR" | "AGAINST" | "ABSTAIN") => {
    const note = prompt("ملاحظة للتصويت (اختياري)")?.trim() || undefined;
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/complaints/${complaintId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: nextVote, note }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل تسجيل التصويت");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button disabled={loading} onClick={() => vote("FOR")} className="rounded-xl border border-green-400/25 px-3 py-2 text-xs font-black text-green-300 disabled:opacity-50">
        مع القرار
      </button>
      <button disabled={loading} onClick={() => vote("AGAINST")} className="rounded-xl border border-red-500/25 px-3 py-2 text-xs font-black text-red-300 disabled:opacity-50">
        ضد
      </button>
      <button disabled={loading} onClick={() => vote("ABSTAIN")} className="rounded-xl border border-white/15 px-3 py-2 text-xs font-black text-gray-300 disabled:opacity-50">
        محايد
      </button>
    </div>
  );
}

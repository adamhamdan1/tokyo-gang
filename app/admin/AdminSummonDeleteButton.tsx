"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  summonId: string;
};

export function AdminSummonDeleteButton({ summonId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const deleteSummon = async () => {
    if (!confirm("حذف لوق الاستدعاء؟")) return;

    setLoading(true);

    try {
      const response = await fetch("/api/admin/summons", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ summonId }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل حذف لوق الاستدعاء");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={deleteSummon}
      className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
    >
      {loading ? "..." : "حذف الاستدعاء"}
    </button>
  );
}

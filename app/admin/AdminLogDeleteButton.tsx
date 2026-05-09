"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  logId: string;
};

export function AdminLogDeleteButton({ logId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const deleteLog = async () => {
    if (!confirm("حذف هذا اللوغ؟")) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/logs/${logId}`, {
        method: "DELETE",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل حذف اللوغ");
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
      onClick={deleteLog}
      className="rounded-full border border-red-500/30 px-3 py-1 text-[10px] font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
    >
      {loading ? "..." : "حذف"}
    </button>
  );
}

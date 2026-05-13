"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  memberId: string;
  warningId?: string;
  all?: boolean;
};

export function AdminWarningDeleteButton({ memberId, warningId, all = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const deleteWarning = async () => {
    const message = all ? "حذف كل تحذيرات العضو وسحب رتب التحذير؟" : "حذف هذا التحذير وسحب رتبته؟";

    if (!confirm(message)) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/admin/members/${memberId}/warnings`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(all ? { all: true } : { warningId }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل حذف التحذير");
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
      onClick={deleteWarning}
      className={
        all
          ? "rounded-xl border border-red-500/35 px-4 py-2 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
          : "rounded-full border border-red-500/30 px-3 py-1 text-xs font-black text-red-300 transition hover:bg-red-500 hover:text-white disabled:opacity-50"
      }
    >
      {loading ? "..." : all ? "حذف كل التحذيرات" : "حذف"}
    </button>
  );
}

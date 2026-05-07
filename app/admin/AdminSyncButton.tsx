"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const syncAcceptedMembers = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/sync-roles", {
        method: "POST",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل مزامنة الرتب");
        return;
      }

      alert(`تمت المزامنة. تم إعطاء الرتبة لـ ${result.synced} عضو`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={syncAcceptedMembers}
      className="rounded-2xl border border-green-400/40 bg-green-400/10 px-5 py-3 text-sm font-black text-green-300 transition hover:bg-green-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "جاري مزامنة الرتب..." : "Sync Discord"}
    </button>
  );
}

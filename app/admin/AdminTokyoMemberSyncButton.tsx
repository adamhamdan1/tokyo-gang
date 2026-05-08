"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminTokyoMemberSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const syncMembers = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/tokyo-members/sync", {
        method: "POST",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشلت مزامنة أعضاء TOKYO");
        return;
      }

      alert(`تمت مزامنة ${result?.count ?? 0} عضو`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={syncMembers}
      className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "جاري مزامنة أعضاء TOKYO..." : "مزامنة أعضاء TOKYO"}
    </button>
  );
}

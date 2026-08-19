"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const syncTokyoMembers = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/tokyo-members/sync", {
        method: "POST",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشلت مزامنة أعضاء العصابة");
        return;
      }

      alert(`تمت مزامنة ${result.count} عضو من Discord إلى قاعدة البيانات`);
      router.refresh();
    } catch {
      alert("تعذر الاتصال بخدمة المزامنة. حاول مرة ثانية.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={syncTokyoMembers}
      className="rounded-2xl border border-green-400/40 bg-green-400/10 px-5 py-3 text-sm font-black text-green-300 transition hover:bg-green-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "جاري جلب الأعضاء..." : "مزامنة أعضاء العصابة"}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLeaveDecisionButtons({ leaveId }: { leaveId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const decide = async (status: "APPROVED" | "REJECTED") => {
    const adminNote = prompt(status === "APPROVED" ? "ملاحظة الموافقة (اختياري)" : "سبب الرفض")?.trim() ?? "";

    if (status === "REJECTED" && !adminNote) {
      return;
    }

    setLoading(status);
    try {
      const response = await fetch(`/api/admin/leaves/${leaveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل تحديث الإجازة");
        return;
      }

      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={loading === "APPROVED"}
        onClick={() => decide("APPROVED")}
        className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-black text-black disabled:opacity-50"
      >
        قبول الإجازة
      </button>
      <button
        type="button"
        disabled={loading === "REJECTED"}
        onClick={() => decide("REJECTED")}
        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
      >
        رفض
      </button>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  complaintId: string;
  status: string;
};

export function AdminComplaintActions({ complaintId, status }: Props) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const updateComplaint = async (nextStatus: "REVIEWING" | "RESOLVED" | "DISMISSED") => {
    const adminNote = prompt("ملاحظة إدارية اختيارية")?.trim() || undefined;
    setLoadingStatus(nextStatus);

    try {
      const response = await fetch(`/api/admin/complaints/${complaintId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus, adminNote }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل تحديث الشكوى");
        return;
      }

      router.refresh();
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={loadingStatus !== null || status === "REVIEWING"}
        onClick={() => updateComplaint("REVIEWING")}
        className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-black text-black disabled:opacity-50"
      >
        {loadingStatus === "REVIEWING" ? "..." : "قيد المراجعة"}
      </button>
      <button
        type="button"
        disabled={loadingStatus !== null || status === "RESOLVED"}
        onClick={() => updateComplaint("RESOLVED")}
        className="rounded-xl bg-green-400 px-4 py-2 text-sm font-black text-black disabled:opacity-50"
      >
        {loadingStatus === "RESOLVED" ? "..." : "حل الشكوى"}
      </button>
      <button
        type="button"
        disabled={loadingStatus !== null || status === "DISMISSED"}
        onClick={() => updateComplaint("DISMISSED")}
        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black text-white disabled:opacity-50"
      >
        {loadingStatus === "DISMISSED" ? "..." : "رفض الشكوى"}
      </button>
    </div>
  );
}

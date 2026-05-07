"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  applicationId: string;
};

export function AdminDecisionButtons({ applicationId }: Props) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const updateStatus = async (status: "ACCEPTED" | "REJECTED") => {
    setLoadingStatus(status);

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "ما قدرنا نحدث حالة التقديم");
        return;
      }

      router.refresh();
    } finally {
      setLoadingStatus(null);
    }
  };

  const deleteApplication = async () => {
    if (!confirm("متأكد بدك تحذف هذا التقديم؟")) {
      return;
    }

    setLoadingStatus("DELETE");

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "ما قدرنا نحذف التقديم");
        return;
      }

      router.refresh();
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      <button
        type="button"
        disabled={loadingStatus !== null}
        onClick={() => updateStatus("ACCEPTED")}
        className="rounded-2xl bg-green-400 px-7 py-3 font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingStatus === "ACCEPTED" ? "جاري القبول..." : "قبول"}
      </button>

      <button
        type="button"
        disabled={loadingStatus !== null}
        onClick={() => updateStatus("REJECTED")}
        className="rounded-2xl bg-red-500 px-7 py-3 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingStatus === "REJECTED" ? "جاري الرفض..." : "رفض"}
      </button>

      <button
        type="button"
        disabled={loadingStatus !== null}
        onClick={deleteApplication}
        className="rounded-2xl border border-white/15 bg-black/40 px-7 py-3 font-black text-gray-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingStatus === "DELETE" ? "جاري الحذف..." : "حذف"}
      </button>
    </div>
  );
}

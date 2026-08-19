"use client";

import { useState } from "react";

export function AdminWeeklyReportButton() {
  const [loading, setLoading] = useState(false);

  const sendReport = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/weekly-report", { method: "POST" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل إرسال التقرير");
        return;
      }

      alert("تم إرسال تقرير النشاط");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={sendReport}
      disabled={loading}
      className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-gray-300 disabled:opacity-50"
    >
      {loading ? "جاري الإرسال..." : "إرسال التقرير للديسكورد"}
    </button>
  );
}

"use client";

import { useState } from "react";

export function AdminDiscordTestButton() {
  const [loading, setLoading] = useState(false);

  const testDiscord = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/discord-test");
      const result = await response.json().catch(() => null);

      alert(result?.message ?? result?.error ?? "لم يرجع Discord نتيجة واضحة");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={testDiscord}
      className="rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "جاري اختبار Discord..." : "اختبار Discord"}
    </button>
  );
}

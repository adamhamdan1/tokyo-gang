"use client";

import { useState } from "react";

export function AdminDiagnosticsButton() {
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/diagnostics");
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل التشخيص");
        return;
      }

      alert(
        [
          `Bot: ${result.bot}`,
          `Guild: ${result.guild}`,
          `Accepted Role: ${result.acceptedRole}`,
          `Warning Roles: ${result.warningRoles}`,
          `Widget: ${result.widget}`,
          result.error ? `Error: ${result.error}` : null,
        ]
          .filter(Boolean)
          .join("\n")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={runDiagnostics}
      className="rounded-2xl border border-cyan-400/25 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-300 hover:text-black disabled:opacity-50"
    >
      {loading ? "جاري التشخيص..." : "Discord Sync Diagnostics"}
    </button>
  );
}

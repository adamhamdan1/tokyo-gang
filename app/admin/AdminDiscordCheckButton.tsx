"use client";

import { useState } from "react";

type Props = {
  memberId: string;
};

export function AdminDiscordCheckButton({ memberId }: Props) {
  const [loading, setLoading] = useState(false);

  const checkMember = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/members/${memberId}/discord-check`, {
        method: "POST",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "فشل فحص العضو");
        return;
      }

      alert(
        [
          `Discord: ${result.inServer ? "موجود" : "غير موجود"}`,
          `Tokyo Role: ${result.hasTokyoRole ? "نعم" : "لا"}`,
          `Warning Role: ${result.warningState}`,
          `Roles: ${result.roleCount}`,
        ].join("\n")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={checkMember}
      disabled={loading}
      className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition hover:bg-cyan-300 hover:text-black disabled:opacity-50"
    >
      {loading ? "جاري الفحص..." : "فحص العضو"}
    </button>
  );
}

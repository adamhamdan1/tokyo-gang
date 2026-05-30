"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminWarningAutoRefresh({ memberId }: { memberId?: string }) {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    const syncWarnings = async () => {
      await fetch("/api/admin/warnings/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      }).catch(() => null);

      if (active) {
        router.refresh();
      }
    };

    const interval = window.setInterval(syncWarnings, 30_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [memberId, router]);

  return null;
}

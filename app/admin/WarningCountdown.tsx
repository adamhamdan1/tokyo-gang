"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  expiresAt: string | null;
};

function formatCountdown(ms: number | null) {
  if (ms === null) {
    return "لا ينتهي تلقائياً";
  }

  if (ms <= 0) {
    return "جاهز للمزامنة";
  }

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days} يوم ${hours} ساعة ${minutes} دقيقة`;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export function WarningCountdown({ expiresAt }: Props) {
  const expiresAtMs = useMemo(() => (expiresAt ? new Date(expiresAt).getTime() : null), [expiresAt]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const remainingMs = expiresAtMs === null ? null : Math.max(0, expiresAtMs - now);
  const endingSoon = remainingMs !== null && remainingMs <= 24 * 60 * 60 * 1000;

  return (
    <span
      className={`rounded-full border px-3 py-1 text-gray-300 ${
        endingSoon ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-white/10"
      }`}
    >
      المتبقي: {formatCountdown(remainingMs)}
    </span>
  );
}

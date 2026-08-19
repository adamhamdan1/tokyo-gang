"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(display-mode: standalone)").matches
  );

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
        console.error("TOKYO service worker registration failed", error);
      });
    }

    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const appInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", appInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", appInstalled);
    };
  }, []);

  if (installed) {
    return <p className="mt-4 text-xs font-black tracking-[2px] text-emerald-400">TOKYO APP // INSTALLED</p>;
  }

  if (!promptEvent) return null;

  return (
    <button
      type="button"
      onClick={async () => {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice.outcome === "accepted") setPromptEvent(null);
      }}
      className="mt-5 inline-flex items-center gap-3 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-xs font-black text-red-200 transition hover:border-red-400/50 hover:bg-red-500/20"
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500 text-white">↓</span>
      تثبيت TOKYO كتطبيق
    </button>
  );
}

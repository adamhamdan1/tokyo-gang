"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Toast = {
  id: number;
  text: string;
};

const ToastContext = createContext<(text: string) => void>(() => {});

export function useTokyoToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useMemo(
    () => (text: string) => {
      const id = Date.now() + Math.random();
      setToasts((current) => [...current, { id, text }].slice(-4));
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3600);
    },
    []
  );

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message?: unknown) => pushToast(String(message ?? ""));

    return () => {
      window.alert = originalAlert;
    };
  }, [pushToast]);

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
      <div className="fixed left-5 top-24 z-[10000] grid max-w-sm gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-black/90 px-5 py-4 text-sm font-black text-white shadow-[0_0_35px_rgba(239,68,68,0.18)] backdrop-blur-xl"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent" />
            <p className="text-[10px] tracking-[4px] text-red-400">TOKYO SYSTEM</p>
            <p className="mt-2 leading-6">{toast.text}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

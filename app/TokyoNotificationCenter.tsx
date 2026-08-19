"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type NotificationLevel = "INFO" | "SUCCESS" | "WARNING" | "DANGER";

type TokyoNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  level: NotificationLevel;
};

type KickStatus = {
  slug: string;
  isLive: boolean;
  title: string;
  viewers: number;
  startedAt: string | null;
};

const READ_KEY = "tokyo-notification-read-v1";
const KNOWN_KEY = "tokyo-notification-known-v1";

const levelClasses: Record<NotificationLevel, string> = {
  INFO: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  SUCCESS: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  WARNING: "border-yellow-400/20 bg-yellow-400/10 text-yellow-300",
  DANGER: "border-red-400/25 bg-red-400/10 text-red-300",
};

function readStoredIds(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 200) : [];
  } catch {
    return [];
  }
}

function relativeTime(value: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60_000));
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} س`;
  return `قبل ${Math.floor(hours / 24)} ي`;
}

export function TokyoNotificationCenter() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<TokyoNotification[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => typeof window === "undefined" ? [] : readStoredIds(READ_KEY));
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
    return Notification.permission;
  });
  const mounted = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const sendDeviceNotification = useCallback(async (item: TokyoNotification) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(item.title, {
        body: item.message,
        icon: "/server-logo.png",
        badge: "/server-logo.png",
        tag: item.id,
        data: { url: item.href },
        dir: "rtl",
      });
    } catch {
      // The in-app center remains available when the browser blocks system alerts.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const [notificationResponse, kickResponse] = await Promise.all([
        fetch(`/api/notifications?t=${Date.now()}`, { cache: "no-store" }),
        fetch(`/api/streamers/status?t=${Date.now()}`, { cache: "no-store" }),
      ]);
      const notificationData = (await notificationResponse.json().catch(() => null)) as { notifications?: TokyoNotification[] } | null;
      const kickData = (await kickResponse.json().catch(() => null)) as { statuses?: KickStatus[] } | null;
      const liveItems: TokyoNotification[] = (kickData?.statuses ?? [])
        .filter((status) => status.isLive)
        .map((status) => ({
          id: `kick:${status.slug}:${status.startedAt ?? "live"}`,
          type: "LIVE",
          title: `${status.slug} مباشر الآن`,
          message: status.title || `بث TOKYO مباشر الآن — ${status.viewers} مشاهد`,
          href: `https://kick.com/${status.slug}`,
          createdAt: status.startedAt ?? new Date().toISOString(),
          level: "DANGER" as const,
        }));
      const nextItems = [...liveItems, ...(notificationData?.notifications ?? [])]
        .filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index)
        .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
        .slice(0, 24);

      const known = readStoredIds(KNOWN_KEY);
      if (mounted.current && known.length > 0) {
        const newItem = nextItems.find((item) => !known.includes(item.id));
        if (newItem) void sendDeviceNotification(newItem);
      }
      const nextKnown = nextItems.map((item) => item.id);
      window.localStorage.setItem(KNOWN_KEY, JSON.stringify(nextKnown));
      setItems(nextItems);
      mounted.current = true;
    } catch {
      // Keep the previous items during a temporary network interruption.
    }
  }, [sendDeviceNotification]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => void loadNotifications(), 0);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadNotifications();
    }, 60_000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") void loadNotifications();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [loadNotifications]);

  useEffect(() => {
    const onPointer = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, []);

  const unread = useMemo(() => items.filter((item) => !readIds.includes(item.id)).length, [items, readIds]);

  useEffect(() => {
    const badgeNavigator = navigator as Navigator & { setAppBadge?: (count?: number) => Promise<void>; clearAppBadge?: () => Promise<void> };
    if (unread > 0) void badgeNavigator.setAppBadge?.(unread).catch(() => undefined);
    else void badgeNavigator.clearAppBadge?.().catch(() => undefined);
  }, [unread]);

  const markAllRead = () => {
    const next = items.map((item) => item.id);
    setReadIds(next);
    window.localStorage.setItem(READ_KEY, JSON.stringify(next));
  };

  const openItem = (item: TokyoNotification) => {
    const next = [...new Set([...readIds, item.id])].slice(-200);
    setReadIds(next);
    window.localStorage.setItem(READ_KEY, JSON.stringify(next));
    setOpen(false);
  };

  const enableDeviceAlerts = async () => {
    if (!("Notification" in window)) return;
    const next = await Notification.requestPermission();
    setPermission(next);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={`الإشعارات${unread ? `، ${unread} غير مقروءة` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-11 w-11 items-center justify-center rounded-[15px] border border-white/10 bg-white/[0.035] text-zinc-300 transition hover:border-red-400/30 hover:bg-red-400/10 hover:text-white"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
          <path d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
        </svg>
        {unread > 0 && (
          <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-black bg-red-500 px-1 text-[9px] font-black text-white shadow-[0_0_14px_rgba(239,68,68,0.75)]">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed left-3 right-3 top-[70px] z-[120] w-auto max-w-none overflow-hidden rounded-[26px] border border-white/10 bg-[#070707]/[0.98] shadow-[0_30px_100px_rgba(0,0,0,0.86),0_0_35px_rgba(239,68,68,0.1)] backdrop-blur-2xl sm:absolute sm:left-0 sm:right-auto sm:top-[calc(100%+14px)] sm:w-[390px] sm:max-w-[calc(100vw-24px)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div>
                <p className="text-[9px] font-black tracking-[3px] text-red-400">TOKYO SIGNALS</p>
                <p className="mt-1 text-base font-black text-white">مركز الإشعارات</p>
              </div>
              {unread > 0 && <button type="button" onClick={markAllRead} className="text-[11px] font-black text-cyan-300 hover:text-white">تحديد الكل كمقروء</button>}
            </div>

            {permission === "default" && (
              <button type="button" onClick={enableDeviceAlerts} className="mx-3 mt-3 flex w-[calc(100%_-_24px)] items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-right text-xs font-black text-emerald-200">
                <span>فعّل تنبيهات الجهاز أثناء استخدام التطبيق</span>
                <span>تفعيل ←</span>
              </button>
            )}

            <div className="max-h-[min(520px,65vh)] overflow-y-auto p-3">
              {items.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-black text-white">لا توجد إشعارات حالياً</p>
                  <p className="mt-2 text-xs text-zinc-500">كل شيء هادئ داخل TOKYO.</p>
                </div>
              ) : items.map((item) => {
                const isUnread = !readIds.includes(item.id);
                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target={item.href.startsWith("http") ? "_blank" : undefined}
                    rel={item.href.startsWith("http") ? "noreferrer" : undefined}
                    onClick={() => openItem(item)}
                    className="group mb-2 flex gap-3 rounded-[19px] border border-white/[0.07] bg-white/[0.025] p-3 text-right transition hover:border-white/15 hover:bg-white/[0.055]"
                  >
                    <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black ${levelClasses[item.level]}`}>
                      {item.type === "LIVE" ? "●" : item.type === "WARNING" || item.type === "SUMMON" ? "!" : "T"}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-1 text-sm font-black text-white">{item.title}</span>
                        {isUnread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.8)]" />}
                      </span>
                      <span className="mt-1 line-clamp-2 block text-xs leading-5 text-zinc-500 group-hover:text-zinc-300">{item.message}</span>
                      <span className="mt-2 block text-[9px] font-black tracking-[1px] text-zinc-600">{relativeTime(item.createdAt)}</span>
                    </span>
                  </a>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

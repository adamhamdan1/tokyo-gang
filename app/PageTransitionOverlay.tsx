"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageTransitionOverlay() {
  const [active, setActive] = useState(false);
  const pathname = usePathname();
  const fallbackTimer = useRef<number | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setActive(false));

    if (fallbackTimer.current !== null) {
      window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = null;
    }

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      const href = link?.getAttribute("href");

      if (!href || href.startsWith("#") || link?.target === "_blank" || link?.hasAttribute("download")) {
        return;
      }

      const destination = new URL(href, window.location.href);
      if (destination.origin !== window.location.origin || destination.href === window.location.href) return;

      setActive(true);
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
      fallbackTimer.current = window.setTimeout(() => setActive(false), 650);
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      if (fallbackTimer.current !== null) window.clearTimeout(fallbackTimer.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none fixed inset-0 z-[99999] flex items-center justify-center bg-black text-white"
        >
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.32, ease: "easeOut" }}
            className="absolute inset-x-0 top-1/2 h-px origin-center bg-gradient-to-r from-transparent via-red-500 to-transparent"
          />
          <div className="text-center">
            <p className="text-xs font-black tracking-[7px] text-red-500">ACCESSING TOKYO SYSTEM</p>
            <p className="mt-3 text-4xl font-black tracking-[8px]">TOKYO</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

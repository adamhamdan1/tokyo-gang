"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PageTransitionOverlay() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const link = target?.closest("a");
      const href = link?.getAttribute("href");

      if (!href || href.startsWith("#") || href.startsWith("http") || link?.target === "_blank") {
        return;
      }

      setActive(true);
      window.setTimeout(() => setActive(false), 900);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
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
            transition={{ duration: 0.55, ease: "easeInOut" }}
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

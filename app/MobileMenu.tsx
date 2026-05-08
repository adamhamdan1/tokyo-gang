"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState } from "react";

export function MobileMenu() {
  const session = useSession();
  const [open, setOpen] = useState(false);

  const links = [
    ["الرئيسية", "#home"],
    ["السيرفر", "#server"],
    ["القيادة", "#command"],
    ["الأعضاء", "#members"],
    ["القوانين", "#rules"],
    ["التقديم", "#apply"],
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="rounded-xl border border-white/20 bg-black/70 px-4 py-2 text-sm font-black"
      >
        القائمة
      </button>

      {open && (
        <div className="absolute left-4 right-4 top-16 rounded-3xl border border-white/15 bg-black/95 p-4 shadow-[0_0_35px_rgba(255,255,255,0.08)]">
          <div className="grid gap-2">
            {links.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-gray-200">
                {label}
              </a>
            ))}
            {session.data?.user && (
              <>
                <a href="/status" className="rounded-2xl border border-green-400/20 px-4 py-3 text-sm font-bold text-green-300">طلبي</a>
                <a href="/complaints" className="rounded-2xl border border-cyan-400/20 px-4 py-3 text-sm font-bold text-cyan-300">الشكاوي</a>
                <a href="/admin" className="rounded-2xl border border-red-500/20 px-4 py-3 text-sm font-bold text-red-300">الإدارة</a>
              </>
            )}
            <button
              type="button"
              onClick={() => (session.data?.user ? signOut() : signIn("discord"))}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-black text-black"
            >
              {session.data?.user ? "خروج" : "Discord"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

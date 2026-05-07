"use client";

import { useEffect, useState } from "react";

type Announcement = {
  id: string;
  title: string;
  message: string;
};

export function AnnouncementsFeed() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    const loadAnnouncements = async () => {
      const response = await fetch("/api/announcements");
      const data = (await response.json().catch(() => null)) as { announcements?: Announcement[] } | null;
      setAnnouncements(data?.announcements ?? []);
    };

    loadAnnouncements();
  }, []);

  if (!announcements.length) {
    return null;
  }

  return (
    <section className="border-y border-white/10 bg-black px-6 py-20">
      <h2 className="mb-4 text-center text-5xl font-black">LATEST ANNOUNCEMENTS</h2>
      <p className="mb-12 text-center text-gray-500 tracking-[4px]">إعلانات القيادة</p>

      <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
        {announcements.map((announcement) => (
          <article key={announcement.id} className="rounded-3xl border border-white/15 bg-zinc-950 p-6 shadow-[0_0_35px_rgba(255,255,255,0.06)]">
            <p className="mb-3 text-xs font-black tracking-[4px] text-red-500">TOKYO NOTICE</p>
            <h3 className="text-2xl font-black text-white">{announcement.title}</h3>
            <p className="mt-4 leading-8 text-gray-400">{announcement.message}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

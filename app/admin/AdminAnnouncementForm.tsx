"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminAnnouncementForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
          const form = e.currentTarget;
          const formData = new FormData(form);
          const response = await fetch("/api/admin/announcements", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: formData.get("title"),
              message: formData.get("message"),
            }),
          });
          const result = await response.json().catch(() => null);

          if (!response.ok) {
            alert(result?.error ?? "فشل إضافة الإعلان");
            return;
          }

          form.reset();
          router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      className="mb-8 grid gap-4 rounded-2xl border border-white/15 bg-zinc-950 p-5 md:mb-10 md:rounded-3xl md:p-6"
    >
      <p className="text-sm font-black tracking-[5px] text-red-500">إضافة إعلان</p>
      <input name="title" required placeholder="عنوان الإعلان" className="rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none" />
      <textarea name="message" required placeholder="نص الإعلان" className="h-28 rounded-2xl border border-white/15 bg-black px-4 py-3 outline-none" />
      <button disabled={loading} className="rounded-2xl bg-white px-6 py-3 font-black text-black disabled:opacity-50">
        {loading ? "جاري الإضافة..." : "إضافة الإعلان"}
      </button>
    </form>
  );
}

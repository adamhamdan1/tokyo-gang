"use client";

import { useRouter } from "next/navigation";

export function AdminAnnouncementDeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const remove = async () => {
    if (!confirm("حذف الإعلان؟")) return;

    const response = await fetch(`/api/admin/announcements/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      alert("فشل حذف الإعلان");
      return;
    }

    router.refresh();
  };

  return (
    <button onClick={remove} className="mt-4 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-black text-red-300">
      حذف
    </button>
  );
}

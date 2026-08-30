"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type Member = { id: string; displayName: string; username: string; image: string | null; internalRank: string };
type Participant = {
  id: string;
  role: string;
  status: string;
  note: string | null;
  checkedInAt: string | null;
  member: Pick<Member, "id" | "displayName" | "username" | "image">;
};
type Operation = {
  id: string;
  code: string;
  title: string;
  type: string;
  objective: string;
  location: string | null;
  startsAt: string;
  priority: string;
  status: string;
  briefing: string | null;
  outcome: string | null;
  commander: { id: string; displayName: string; image: string | null } | null;
  participants: Participant[];
};

const statusLabels: Record<string, string> = { PLANNED: "مجدولة", ACTIVE: "نشطة", COMPLETED: "مكتملة", CANCELLED: "ملغاة" };
const participantLabels: Record<string, string> = { INVITED: "مكلّف", CONFIRMED: "مؤكد", PRESENT: "حاضر", ABSENT: "غائب", EXCUSED: "معذور" };
const roleLabels: Record<string, string> = { COMMANDER: "قائد", UNIT: "فريق", SUPPORT: "دعم", SECURITY: "أمن", MEDIA: "إعلام" };

export function AdminOperationsCenter({ members, operations }: { members: Member[]; operations: Operation[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const filtered = useMemo(() => operations.filter((operation) => {
    if (filter !== "ALL" && operation.status !== filter) return false;
    const needle = query.trim().toLowerCase();
    return !needle || `${operation.code} ${operation.title} ${operation.objective} ${operation.commander?.displayName ?? ""}`.toLowerCase().includes(needle);
  }), [filter, operations, query]);

  const createOperation = async (formData: FormData) => {
    setLoading("CREATE");
    setError("");
    try {
      const response = await fetch("/api/admin/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.get("title"),
          type: formData.get("type"),
          objective: formData.get("objective"),
          location: formData.get("location"),
          startsAt: new Date(String(formData.get("startsAt"))).toISOString(),
          priority: formData.get("priority"),
          briefing: formData.get("briefing"),
          commanderId: formData.get("commanderId"),
          participantIds: selectedMembers,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "فشل إنشاء العملية");
      setCreating(false);
      setSelectedMembers([]);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر الاتصال بالخادم");
    } finally {
      setLoading(null);
    }
  };

  const update = async (operationId: string, payload: Record<string, unknown>, key: string) => {
    setLoading(key);
    setError("");
    try {
      const response = await fetch(`/api/admin/operations/${operationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "فشل تحديث العملية");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر الاتصال بالخادم");
    } finally {
      setLoading(null);
    }
  };

  const changeStatus = (operation: Operation, status: string) => {
    const outcome = status === "COMPLETED" ? prompt("اكتب نتيجة العملية والإنجاز النهائي")?.trim() : "";
    if (status === "COMPLETED" && !outcome) return;
    void update(operation.id, { action: "STATUS", status, outcome }, `STATUS-${operation.id}`);
  };

  return (
    <>
      <header className="tokyo-glass relative overflow-hidden rounded-[28px] p-6 md:rounded-[36px] md:p-9">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-red-500/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black tracking-[6px] text-red-400">TOKYO OPERATIONS COMMAND</p>
            <h1 className="tokyo-section-title mt-3 text-4xl font-black md:text-6xl">مركز العمليات</h1>
            <p className="mt-4 max-w-3xl leading-8 text-zinc-400">خطط، كلّف الفريق، تابع الحضور، وأغلق العملية بنتيجة محفوظة في السجل الإداري.</p>
          </div>
          <button type="button" onClick={() => setCreating(true)} className="rounded-2xl bg-red-500 px-7 py-4 font-black text-white shadow-[0_0_35px_rgba(239,68,68,0.3)] transition hover:bg-red-400">+ إنشاء عملية</button>
        </div>
        <div className="relative mt-7 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            ["العمليات", operations.length],
            ["نشطة الآن", operations.filter((item) => item.status === "ACTIVE").length],
            ["قادمة", operations.filter((item) => item.status === "PLANNED").length],
            ["أعضاء مكلّفون", new Set(operations.flatMap((item) => item.participants.map((entry) => entry.member.id))).size],
          ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-black/40 p-4"><p className="text-xs text-zinc-500">{label}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}
        </div>
      </header>

      {error && <p className="sticky top-3 z-50 mt-5 rounded-2xl border border-red-400/30 bg-red-950/95 p-4 font-black text-red-200 shadow-2xl">{error}</p>}

      <section className="my-6 grid gap-3 rounded-3xl border border-white/10 bg-black/60 p-4 md:grid-cols-[1fr_auto]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالكود، العنوان، الهدف أو القائد..." className="rounded-2xl border border-white/10 bg-zinc-950 px-5 py-3 outline-none focus:border-cyan-400/40" />
        <div className="flex gap-2 overflow-x-auto">
          {["ALL", "PLANNED", "ACTIVE", "COMPLETED", "CANCELLED"].map((status) => <button key={status} onClick={() => setFilter(status)} className={`whitespace-nowrap rounded-xl px-4 py-3 text-xs font-black ${filter === status ? "bg-white text-black" : "border border-white/10 text-zinc-400"}`}>{status === "ALL" ? "الكل" : statusLabels[status]}</button>)}
        </div>
      </section>

      <section className="grid gap-5">
        {filtered.length === 0 && <div className="rounded-3xl border border-dashed border-white/15 p-12 text-center text-zinc-500">لا توجد عمليات مطابقة.</div>}
        {filtered.map((operation) => {
          const present = operation.participants.filter((item) => item.status === "PRESENT").length;
          return (
            <article key={operation.id} className={`tokyo-panel overflow-hidden p-0 ${operation.status === "ACTIVE" ? "border-red-400/35 shadow-[0_0_45px_rgba(239,68,68,0.1)]" : ""}`}>
              <div className="grid gap-6 p-5 md:p-7 xl:grid-cols-[0.75fr_1.25fr]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-300">{operation.code}</span>
                    <span className="rounded-full border border-white/10 px-3 py-1 text-xs font-black text-zinc-300">{statusLabels[operation.status]}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black ${operation.priority === "CRITICAL" ? "bg-red-500 text-white" : operation.priority === "HIGH" ? "bg-orange-400 text-black" : "bg-white/10 text-zinc-300"}`}>{operation.priority}</span>
                  </div>
                  <h2 className="mt-4 text-3xl font-black">{operation.title}</h2>
                  <p className="mt-3 leading-8 text-zinc-400">{operation.objective}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-600">الموعد</p><p className="mt-1 font-black">{new Date(operation.startsAt).toLocaleString("ar")}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-600">القائد</p><p className="mt-1 font-black">{operation.commander?.displayName ?? "غير محدد"}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-600">المكان</p><p className="mt-1 font-black">{operation.location ?? "سري"}</p></div>
                    <div className="rounded-2xl border border-white/10 bg-black/35 p-3"><p className="text-xs text-zinc-600">الحضور</p><p className="mt-1 font-black">{present}/{operation.participants.length}</p></div>
                  </div>
                  {operation.briefing && <p className="mt-4 rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.05] p-4 text-sm leading-7 text-yellow-100">{operation.briefing}</p>}
                  {operation.outcome && <p className="mt-4 rounded-2xl border border-green-400/20 bg-green-400/[0.07] p-4 text-sm leading-7 text-green-100"><strong>النتيجة:</strong> {operation.outcome}</p>}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {operation.status === "PLANNED" && <button disabled={loading !== null} onClick={() => changeStatus(operation, "ACTIVE")} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-black">بدء العملية</button>}
                    {operation.status === "ACTIVE" && <button disabled={loading !== null} onClick={() => changeStatus(operation, "COMPLETED")} className="rounded-xl bg-green-400 px-4 py-2 text-sm font-black text-black">إغلاق وتسجيل النتيجة</button>}
                    {(operation.status === "PLANNED" || operation.status === "ACTIVE") && <button disabled={loading !== null} onClick={() => changeStatus(operation, "CANCELLED")} className="rounded-xl border border-white/15 px-4 py-2 text-sm font-black text-zinc-400">إلغاء</button>}
                  </div>
                </div>
                <div>
                  <div className="mb-3 flex items-center justify-between"><p className="text-xs font-black tracking-[4px] text-cyan-300">OPERATION UNIT</p><span className="text-xs text-zinc-600">{operation.participants.length} عضو</span></div>
                  <div className="grid gap-2">
                    {operation.participants.map((participant) => (
                      <div key={participant.id} className="grid gap-2 rounded-2xl border border-white/10 bg-black/40 p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
                        <div><p className="font-black">{participant.member.displayName}</p><p className="mt-1 text-xs text-zinc-600">@{participant.member.username}</p></div>
                        <select value={participant.role} disabled={loading !== null} onChange={(event) => void update(operation.id, { action: "PARTICIPANT", participantId: participant.id, participantStatus: participant.status, participantRole: event.target.value, note: participant.note }, `P-${participant.id}`)} className="rounded-xl border border-white/10 bg-zinc-950 px-3 py-2 text-xs font-black">
                          {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                        <select value={participant.status} disabled={loading !== null} onChange={(event) => void update(operation.id, { action: "PARTICIPANT", participantId: participant.id, participantStatus: event.target.value, participantRole: participant.role, note: participant.note }, `P-${participant.id}`)} className={`rounded-xl border px-3 py-2 text-xs font-black ${participant.status === "PRESENT" ? "border-green-400/25 bg-green-400/10 text-green-300" : participant.status === "ABSENT" ? "border-red-400/25 bg-red-400/10 text-red-300" : "border-white/10 bg-zinc-950"}`}>
                          {Object.entries(participantLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {creating && (
        <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/90 p-3 backdrop-blur-xl md:p-8">
          <form action={createOperation} className="mx-auto max-w-4xl overflow-hidden rounded-[30px] border border-red-400/25 bg-zinc-950 shadow-[0_40px_140px_rgba(0,0,0,0.8)]">
            <div className="border-b border-white/10 bg-red-500/[0.07] p-6 md:p-8"><p className="text-xs font-black tracking-[5px] text-red-300">NEW OPERATION FILE</p><h2 className="mt-3 text-3xl font-black">إنشاء عملية جديدة</h2></div>
            <div className="grid gap-4 p-6 md:grid-cols-2 md:p-8">
              <label className="grid gap-2 text-sm font-black">العنوان<input name="title" required maxLength={120} className="rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-red-400/40" /></label>
              <label className="grid gap-2 text-sm font-black">الموعد<input name="startsAt" type="datetime-local" required className="rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none focus:border-red-400/40" /></label>
              <label className="grid gap-2 text-sm font-black">النوع<select name="type" className="rounded-2xl border border-white/10 bg-black px-4 py-3"><option value="MISSION">مهمة</option><option value="MEETING">اجتماع</option><option value="TRAINING">تدريب</option><option value="SECURITY">أمن</option><option value="MEDIA">إعلام</option></select></label>
              <label className="grid gap-2 text-sm font-black">الأولوية<select name="priority" className="rounded-2xl border border-white/10 bg-black px-4 py-3"><option value="NORMAL">عادية</option><option value="HIGH">عالية</option><option value="CRITICAL">حرجة</option></select></label>
              <label className="grid gap-2 text-sm font-black">قائد العملية<select name="commanderId" className="rounded-2xl border border-white/10 bg-black px-4 py-3"><option value="">بدون قائد</option>{members.map((member) => <option key={member.id} value={member.id}>{member.displayName} — {member.internalRank}</option>)}</select></label>
              <label className="grid gap-2 text-sm font-black">المكان<input name="location" maxLength={160} placeholder="اختياري / سري" className="rounded-2xl border border-white/10 bg-black px-4 py-3 outline-none" /></label>
              <label className="grid gap-2 text-sm font-black md:col-span-2">الهدف<textarea name="objective" required maxLength={1000} className="min-h-24 rounded-2xl border border-white/10 bg-black px-4 py-3 leading-7 outline-none" /></label>
              <label className="grid gap-2 text-sm font-black md:col-span-2">التعليمات السرية<textarea name="briefing" maxLength={2000} className="min-h-20 rounded-2xl border border-white/10 bg-black px-4 py-3 leading-7 outline-none" /></label>
              <div className="md:col-span-2"><p className="mb-3 text-sm font-black">اختيار الفريق — {selectedMembers.length}</p><div className="tokyo-scrollbar grid max-h-64 gap-2 overflow-y-auto rounded-2xl border border-white/10 bg-black/50 p-3 sm:grid-cols-2 md:grid-cols-3">{members.map((member) => <label key={member.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm ${selectedMembers.includes(member.id) ? "border-red-400/40 bg-red-400/10" : "border-white/10"}`}><input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={(event) => setSelectedMembers((current) => event.target.checked ? [...current, member.id] : current.filter((id) => id !== member.id))} /><span><strong className="block">{member.displayName}</strong><small className="text-zinc-600">{member.internalRank}</small></span></label>)}</div></div>
              {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200 md:col-span-2">{error}</p>}
              <div className="flex flex-col-reverse gap-3 md:col-span-2 sm:flex-row"><button type="button" onClick={() => setCreating(false)} className="flex-1 rounded-2xl border border-white/15 py-4 font-black text-zinc-400">إلغاء</button><button disabled={loading !== null} className="flex-1 rounded-2xl bg-red-500 py-4 font-black text-white disabled:opacity-50">{loading === "CREATE" ? "جاري إنشاء وتبليغ الفريق..." : "إنشاء وإرسال التكليفات"}</button></div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

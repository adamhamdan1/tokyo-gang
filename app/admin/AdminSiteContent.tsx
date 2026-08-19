"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TokyoSiteContent } from "@/lib/site-content";

type SectionKey = keyof TokyoSiteContent;

const sectionLabels: Record<SectionKey, { label: string; hint: string }> = {
  leadership: { label: "القيادة", hint: "الأسماء والمناصب وترتيب الظهور" },
  streamers: { label: "الستريمرز", hint: "الروابط والصور والتوثيق" },
  timeline: { label: "المسيرة", hint: "مراحل تطور TOKYO" },
  wars: { label: "أرشيف العمليات", hint: "ملفات الحروب والنتائج" },
};

const inputClass = "w-full rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-red-400/45";

function newId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

export function AdminSiteContent({ initialContent }: { initialContent: TokyoSiteContent }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [section, setSection] = useState<SectionKey>("leadership");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const updateItem = (index: number, field: string, value: string | boolean) => {
    setContent((current) => {
      const nextItems = (current[section] as unknown as Array<Record<string, unknown>>).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      );
      return { ...current, [section]: nextItems } as TokyoSiteContent;
    });
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    setContent((current) => {
      const nextItems = [...(current[section] as unknown as Array<Record<string, unknown>> )];
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= nextItems.length) return current;
      [nextItems[index], nextItems[nextIndex]] = [nextItems[nextIndex], nextItems[index]];
      return { ...current, [section]: nextItems } as TokyoSiteContent;
    });
  };

  const removeItem = (index: number) => {
    setContent((current) => ({
      ...current,
      [section]: (current[section] as unknown as Array<Record<string, unknown>>).filter((_, itemIndex) => itemIndex !== index),
    }) as TokyoSiteContent);
  };

  const addItem = () => {
    const item = section === "leadership"
      ? { id: newId("leader"), name: "اسم جديد", role: "المنصب", code: `HC-${String(content.leadership.length + 1).padStart(2, "0")}`, visible: true }
      : section === "streamers"
        ? { id: newId("creator"), name: "ستريمر جديد", role: "ستريمر رسمي", handle: "@username", kick: "https://kick.com/", logo: "/tokyo-logo-clean.png", verified: false, visible: true }
        : section === "timeline"
          ? { id: newId("timeline"), title: "مرحلة جديدة", description: "اكتب تفاصيل المرحلة هنا.", visible: true }
          : { id: newId("operation"), code: `OP-${String(content.wars.length + 1).padStart(3, "0")}`, title: "عملية جديدة", summary: "ملخص العملية.", outcome: "نتيجة العملية.", year: new Date().getFullYear().toString(), type: "عملية ميدانية", status: "CLOSED" as const, visible: true };

    setContent((current) => ({ ...current, [section]: [...current[section], item] }) as TokyoSiteContent);
  };

  const save = async () => {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/site-content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(result?.error ?? "فشل حفظ المحتوى");
        return;
      }
      setContent(result.content);
      setMessage("تم حفظ ونشر المحتوى على الموقع");
      router.refresh();
    } catch {
      setMessage("تعذر الاتصال بخدمة المحتوى");
    } finally {
      setSaving(false);
    }
  };

  const items = content[section];

  return (
    <section className="tokyo-glass mb-8 overflow-visible rounded-2xl border-red-400/20 p-5 md:mb-10 md:rounded-3xl md:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black tracking-[4px] text-red-300">TOKYO CONTENT CONTROL</p>
          <h3 className="mt-3 text-2xl font-black text-white">إدارة محتوى الموقع</h3>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-400">
            عدّل الأسماء والروابط وملفات العمليات من هنا. الترتيب والحالة ينحفظان في قاعدة البيانات ويظهران مباشرة بعد النشر.
          </p>
        </div>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-2xl bg-red-500 px-6 py-3.5 text-sm font-black text-white shadow-[0_0_30px_rgba(239,68,68,0.2)] transition hover:bg-red-400 disabled:opacity-50"
        >
          {saving ? "جاري النشر..." : "حفظ ونشر التعديلات"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {(Object.keys(sectionLabels) as SectionKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setSection(key);
              setMessage("");
            }}
            className={`rounded-2xl border px-4 py-3 text-right transition ${section === key ? "border-red-400/40 bg-red-400/10" : "border-white/10 bg-black/35 hover:border-white/20"}`}
          >
            <span className="block text-sm font-black text-white">{sectionLabels[key].label}</span>
            <span className="mt-1 block text-[10px] leading-5 text-zinc-600">{sectionLabels[key].hint}</span>
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-3">
        {items.map((item, index) => (
          <article key={item.id} className={`rounded-[22px] border border-white/10 bg-black/40 p-4 ${item.visible ? "" : "opacity-55"}`}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] font-mono text-[10px] text-zinc-500">{String(index + 1).padStart(2, "0")}</span>
                <span className="text-sm font-black text-white">{"name" in item ? item.name : item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" disabled={index === 0} onClick={() => moveItem(index, -1)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white disabled:opacity-20">↑</button>
                <button type="button" disabled={index === items.length - 1} onClick={() => moveItem(index, 1)} className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white disabled:opacity-20">↓</button>
                <button type="button" onClick={() => updateItem(index, "visible", !item.visible)} className={`rounded-lg border px-3 py-1.5 text-[10px] font-black ${item.visible ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"}`}>{item.visible ? "ظاهر" : "مخفي"}</button>
                <button type="button" onClick={() => removeItem(index)} className="rounded-lg border border-red-400/15 px-3 py-1.5 text-[10px] font-black text-red-300 hover:bg-red-400/10">حذف</button>
              </div>
            </div>

            {section === "leadership" && "name" in item && "code" in item && (
              <div className="grid gap-3 md:grid-cols-[1fr_1fr_0.45fr]">
                <input className={inputClass} value={item.name} onChange={(event) => updateItem(index, "name", event.target.value)} placeholder="الاسم" />
                <input className={inputClass} value={item.role} onChange={(event) => updateItem(index, "role", event.target.value)} placeholder="المنصب" />
                <input dir="ltr" className={inputClass} value={item.code} onChange={(event) => updateItem(index, "code", event.target.value)} placeholder="HC-01" />
              </div>
            )}

            {section === "streamers" && "handle" in item && (
              <div className="grid gap-3 md:grid-cols-2">
                <input className={inputClass} value={item.name} onChange={(event) => updateItem(index, "name", event.target.value)} placeholder="الاسم" />
                <input className={inputClass} value={item.role} onChange={(event) => updateItem(index, "role", event.target.value)} placeholder="Kick Partner أو ستريمر رسمي" />
                <input dir="ltr" className={inputClass} value={item.handle} onChange={(event) => updateItem(index, "handle", event.target.value)} placeholder="@username" />
                <input dir="ltr" className={inputClass} value={item.kick} onChange={(event) => updateItem(index, "kick", event.target.value)} placeholder="https://kick.com/..." />
                <input dir="ltr" className={inputClass} value={item.logo} onChange={(event) => updateItem(index, "logo", event.target.value)} placeholder="رابط الصورة" />
                <input dir="ltr" className={inputClass} value={item.tiktok ?? ""} onChange={(event) => updateItem(index, "tiktok", event.target.value)} placeholder="رابط TikTok (اختياري)" />
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/55 px-4 py-3">
                  <button type="button" onClick={() => updateItem(index, "verified", !item.verified)} className={`flex h-6 w-6 items-center justify-center rounded-full ${item.verified ? "bg-[#53fc18] text-black" : "border border-white/15 text-transparent"}`}>✓</button>
                  <span className="text-sm font-bold text-zinc-300">Kick Partner موثّق</span>
                </div>
              </div>
            )}

            {section === "timeline" && "description" in item && !('summary' in item) && (
              <div className="grid gap-3 md:grid-cols-[0.65fr_1.35fr]">
                <input className={inputClass} value={item.title} onChange={(event) => updateItem(index, "title", event.target.value)} placeholder="عنوان المرحلة" />
                <input className={inputClass} value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} placeholder="وصف المرحلة" />
              </div>
            )}

            {section === "wars" && "summary" in item && (
              <div className="grid gap-3 md:grid-cols-2">
                <input className={inputClass} value={item.title} onChange={(event) => updateItem(index, "title", event.target.value)} placeholder="اسم العملية" />
                <input className={inputClass} value={item.type} onChange={(event) => updateItem(index, "type", event.target.value)} placeholder="نوع العملية" />
                <input className={inputClass} value={item.summary} onChange={(event) => updateItem(index, "summary", event.target.value)} placeholder="الملخص" />
                <input className={inputClass} value={item.outcome} onChange={(event) => updateItem(index, "outcome", event.target.value)} placeholder="النتيجة" />
                <input dir="ltr" className={inputClass} value={item.code} onChange={(event) => updateItem(index, "code", event.target.value)} placeholder="OP-001" />
                <div className="grid grid-cols-2 gap-3">
                  <input dir="ltr" className={inputClass} value={item.year} onChange={(event) => updateItem(index, "year", event.target.value)} placeholder="2026" />
                  <select className={inputClass} value={item.status} onChange={(event) => updateItem(index, "status", event.target.value)}>
                    <option value="CLOSED">مكتملة</option>
                    <option value="ACTIVE">نشطة</option>
                    <option value="CLASSIFIED">سرية</option>
                  </select>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={addItem} className="rounded-2xl border border-white/15 bg-white/[0.035] px-5 py-3 text-sm font-black text-white transition hover:border-red-400/35 hover:bg-red-400/[0.07]">+ إضافة عنصر جديد</button>
        <p className={`text-xs ${message.startsWith("تم") ? "text-emerald-300" : "text-red-300"}`} aria-live="polite">{message}</p>
      </div>
    </section>
  );
}

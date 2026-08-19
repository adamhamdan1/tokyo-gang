"use client";

import { useState } from "react";

type WebhookStatus = {
  kind: "APPLICATIONS" | "ADMIN_LOG";
  configured: boolean;
  managed: boolean;
  channelId: string;
};

const labels = {
  APPLICATIONS: {
    title: "Webhook التقديمات",
    description: "يستقبل كل طلب تقديم جديد داخل القناة المحددة.",
  },
  ADMIN_LOG: {
    title: "Webhook سجل الإدارة",
    description: "يستقبل القرارات والإجراءات وتقارير لوحة الإدارة.",
  },
};

export function AdminWebhookConfig({ initialStatuses }: { initialStatuses: WebhookStatus[] }) {
  const [statuses, setStatuses] = useState(initialStatuses);
  const [channels, setChannels] = useState<Record<string, string>>(
    Object.fromEntries(initialStatuses.map((status) => [status.kind, status.channelId]))
  );
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const create = async (kind: WebhookStatus["kind"]) => {
    setLoading(kind);
    setMessage("");

    try {
      const response = await fetch("/api/admin/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, channelId: channels[kind] }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(result?.error ?? "فشل إنشاء Webhook");
        return;
      }

      setStatuses(result.webhooks);
      setMessage(`تم إنشاء ${labels[kind].title} وحفظه في قاعدة البيانات`);
    } catch {
      setMessage("تعذر الاتصال بخدمة Webhooks");
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="tokyo-glass mb-8 rounded-2xl border-purple-400/20 p-5 md:mb-10 md:rounded-3xl md:p-6">
      <p className="text-xs font-black tracking-[4px] text-purple-300">MANAGED WEBHOOKS</p>
      <h3 className="mt-3 text-2xl font-black text-white">مركز Webhooks</h3>
      <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-400">
        ضع Channel ID واضغط إنشاء. البوت ينشئ Webhook جديد ويحفظ رابطه داخل قاعدة البيانات بدون الحاجة إلى Cloudflare Env.
      </p>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {statuses.map((status) => {
          const label = labels[status.kind];
          return (
            <article key={status.kind} className="rounded-2xl border border-white/10 bg-black/35 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-black text-white">{label.title}</h4>
                  <p className="mt-1 text-xs leading-6 text-gray-500">{label.description}</p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${
                  status.managed
                    ? "border-green-400/20 bg-green-400/10 text-green-300"
                    : status.configured
                      ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-300"
                      : "border-red-400/20 bg-red-400/10 text-red-300"
                }`}>
                  {status.managed ? "محفوظ بالداتابيس" : status.configured ? "إعداد قديم" : "غير مربوط"}
                </span>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={channels[status.kind] ?? ""}
                  onChange={(event) => setChannels((current) => ({ ...current, [status.kind]: event.target.value.replace(/\D/g, "") }))}
                  placeholder="Channel ID"
                  inputMode="numeric"
                  className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/60 px-4 py-3 font-mono text-xs text-white outline-none focus:border-purple-400/50"
                />
                <button
                  type="button"
                  disabled={loading !== null || !channels[status.kind]}
                  onClick={() => void create(status.kind)}
                  className="rounded-xl bg-purple-300 px-5 py-3 text-sm font-black text-black transition hover:bg-white disabled:opacity-40"
                >
                  {loading === status.kind ? "جاري الإنشاء..." : status.managed ? "إنشاء بديل" : "إنشاء وحفظ"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className={`mt-4 text-xs ${message.startsWith("تم") ? "text-green-300" : "text-red-300"}`} aria-live="polite">{message}</p>
    </section>
  );
}

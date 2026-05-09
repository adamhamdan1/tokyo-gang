"use client";

import { useState } from "react";

export function ApplicationForm() {
  const [experience, setExperience] = useState("");
  const [reason, setReason] = useState("");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const steps = ["Discord Login", "Rules", "Info", "Submit"];
  const activeStep = submitted ? 3 : rulesAccepted ? 2 : 1;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setMessage(null);
        setSubmitted(false);

        const form = e.currentTarget;
        const formData = new FormData(form);
        const age = Number(formData.get("age"));

        if (!rulesAccepted) {
          setMessage({ type: "error", text: "لازم توافق على القوانين قبل التقديم" });
          return;
        }

        if (!Number.isFinite(age) || age < 16) {
          setMessage({ type: "error", text: "الحد الأدنى للعمر هو 16" });
          return;
        }

        const response = await fetch("/api/apply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.get("name"),
            age: formData.get("age"),
            city: formData.get("city"),
            experience: formData.get("experience"),
            reason: formData.get("reason"),
            dailyHours: formData.get("dailyHours"),
            hasMic: formData.get("hasMic") === "on",
            acceptedRules: rulesAccepted,
          }),
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
          setMessage({ type: "error", text: result?.error ?? "صار خطأ أثناء إرسال الطلب" });
          return;
        }

        setMessage({ type: "success", text: "تم إرسال طلبك بنجاح. تقدر تتابع الحالة من صفحة طلبي." });
        setSubmitted(true);
        setExperience("");
        setReason("");
        setRulesAccepted(false);
        setRulesChecked(false);
        form.reset();
      }}
      className="max-w-2xl mx-auto grid gap-5"
    >
      <div className="rounded-3xl border border-white/10 bg-zinc-950/80 p-5 shadow-[0_0_35px_rgba(255,255,255,0.05)]">
        <div className="grid grid-cols-4 gap-2">
          {steps.map((step, index) => (
            <div key={step} className="relative text-center">
              <div
                className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black ${
                  index <= activeStep
                    ? "border-green-400 bg-green-400 text-black shadow-[0_0_18px_rgba(74,222,128,0.5)]"
                    : "border-white/20 bg-black text-gray-400"
                }`}
              >
                {index + 1}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-500">{step}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-green-400 via-white to-red-500 shadow-[0_0_20px_rgba(74,222,128,0.35)] transition-all duration-500"
            style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {message && (
        <div
          className={`rounded-3xl border p-5 text-center font-black ${
            message.type === "success"
              ? "border-green-400/30 bg-green-400/10 text-green-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {!rulesAccepted ? (
        <section className="rounded-3xl border border-green-400/20 bg-green-400/5 p-6 shadow-[0_0_35px_rgba(74,222,128,0.08)]">
          <p className="text-xs font-black tracking-[5px] text-green-400">TOKYO RULES CLEARANCE</p>
          <h3 className="mt-4 text-3xl font-black text-white">اقرأ القوانين قبل التقديم</h3>
          <div className="mt-5 grid gap-3 text-sm leading-7 text-gray-300">
            {[
              "الاحترام بين الأعضاء والإدارة خط أحمر.",
              "ممنوع الخيانة أو تسريب معلومات العصابة.",
              "الالتزام بأوامر القيادة وقت الاجتماعات والحروب.",
              "أي مخالفة ممكن تسبب رفض الطلب أو سحب الرتبة.",
            ].map((rule) => (
              <div key={rule} className="rounded-2xl border border-white/10 bg-black/35 p-4">
                {rule}
              </div>
            ))}
          </div>
          <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/15 bg-zinc-950 p-4 leading-8">
            <input
              type="checkbox"
              checked={rulesChecked}
              onChange={(event) => setRulesChecked(event.target.checked)}
              className="mt-2 h-5 w-5"
            />
            <span>قرأت القوانين وأوافق عليها وأفهم أن التقديم بدون التزام ينرفض.</span>
          </label>
          <button
            type="button"
            disabled={!rulesChecked}
            onClick={() => {
              setRulesAccepted(true);
              setMessage(null);
              setSubmitted(false);
            }}
            className="mt-5 w-full rounded-2xl bg-white py-4 font-black text-black transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            أوافق وأبدأ التقديم
          </button>
        </section>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <input name="name" required placeholder="اسمك داخل اللعبة" className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none" />
            <input name="age" required type="number" min={16} placeholder="عمرك" className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none" />
          </div>

          <input name="city" required placeholder="في اي مدينة؟" className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none" />

          <div>
            <textarea
              name="experience"
              required
              minLength={20}
              maxLength={500}
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              placeholder="خبرتك في فايف إم"
              className="w-full bg-zinc-950 border border-white/20 rounded-2xl p-4 h-32 outline-none"
            />
            <p className="mt-2 text-left text-xs text-gray-500">{experience.length}/500</p>
          </div>

          <div>
            <textarea
              name="reason"
              required
              minLength={20}
              maxLength={500}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ليش بدك تنضم؟"
              className="w-full bg-zinc-950 border border-white/20 rounded-2xl p-4 h-32 outline-none"
            />
            <p className="mt-2 text-left text-xs text-gray-500">{reason.length}/500</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <select name="dailyHours" required className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none">
              <option value="">كم ساعة تلعب باليوم؟</option>
              <option>أقل من ساعة</option>
              <option>1-3 ساعات</option>
              <option>3-5 ساعات</option>
              <option>أكثر من 5 ساعات</option>
            </select>

            <label className="flex items-center gap-3 rounded-2xl border border-white/20 bg-zinc-950 p-4">
              <input name="hasMic" type="checkbox" className="h-5 w-5" />
              <span>عندي مايك</span>
            </label>
          </div>

          <div className="rounded-2xl border border-green-400/20 bg-green-400/10 p-4 text-sm font-bold leading-8 text-green-200">
            تم قبول القوانين. كمل بياناتك وارسل الطلب.
          </div>

          <button className="bg-white text-black rounded-2xl py-4 font-bold hover:bg-gray-300 transition">
            إرسال الطلب
          </button>
        </>
      )}
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  applicationId: string;
  status: string;
  applicationType?: "GANG" | "STREAMER";
  interviewAssignedTo?: string | null;
  interviewScore?: number | null;
};

export function AdminDecisionButtons({ applicationId, status, applicationType = "GANG", interviewAssignedTo, interviewScore }: Props) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [interviewAt, setInterviewAt] = useState("");
  const [interviewNote, setInterviewNote] = useState("");
  const [interviewInternalNote, setInterviewInternalNote] = useState("");
  const [interviewAssignee, setInterviewAssignee] = useState(interviewAssignedTo ?? "");
  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const [attendance, setAttendance] = useState("PRESENT");
  const [score, setScore] = useState(String(interviewScore ?? 75));
  const [evaluation, setEvaluation] = useState("");
  const [error, setError] = useState("");

  const updateStatus = async (
    status: "ACCEPTED" | "REJECTED" | "INTERVIEW" | "TRIAL",
    interview?: { at: string; note: string; internalNote: string; assignedTo: string }
  ) => {
    const decisionReason =
      status === "REJECTED" ? prompt("اكتب سبب الرفض")?.trim() : undefined;
    const internalNote = status === "INTERVIEW" ? interview?.internalNote || undefined : prompt("ملاحظة داخلية للإدارة (اختياري)")?.trim() || undefined;

    if (status === "REJECTED" && !decisionReason) {
      alert("لازم تكتب سبب الرفض");
      return;
    }

    setLoadingStatus(status);
    setError("");

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          decisionReason,
          interviewAt: interview?.at,
          interviewNote: interview?.note,
          interviewAssignedTo: interview?.assignedTo,
          internalNote,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const message = result?.error ?? "ما قدرنا نحدث حالة التقديم";
        setError(message);
        alert(message);
        return;
      }

      if (status === "INTERVIEW") {
        setInterviewOpen(false);
        setInterviewAt("");
        setInterviewNote("");
        setInterviewInternalNote("");
      }
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم. حاول مرة ثانية.");
    } finally {
      setLoadingStatus(null);
    }
  };

  const saveInterviewEvaluation = async () => {
    setLoadingStatus("EVALUATION");
    setError("");
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "INTERVIEW_RESULT", interviewAttendance: attendance, interviewScore: Number(score), interviewEvaluation: evaluation }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error ?? "فشل حفظ تقييم المقابلة");
      setEvaluationOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "تعذر الاتصال بالخادم");
    } finally {
      setLoadingStatus(null);
    }
  };

  const deleteApplication = async () => {
    const confirmation = prompt("لحذف التقديم اكتب DELETE")?.trim();

    if (confirmation !== "DELETE") {
      return;
    }

    setLoadingStatus("DELETE");

    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        alert(result?.error ?? "ما قدرنا نحذف التقديم");
        return;
      }

      router.refresh();
    } finally {
      setLoadingStatus(null);
    }
  };

  return (
    <div className="mt-6 flex flex-wrap gap-3">
      {error && <p className="w-full rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">{error}</p>}

      <button
        type="button"
        disabled={loadingStatus !== null || status === "ACCEPTED"}
        onClick={() => updateStatus("ACCEPTED")}
        className="rounded-2xl bg-green-400 px-7 py-3 font-black text-black transition hover:bg-green-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "ACCEPTED" ? "مقبول بالفعل" : loadingStatus === "ACCEPTED" ? "جاري القبول..." : applicationType === "STREAMER" ? "قبول وإعطاء Streamer" : "قبول"}
      </button>

      {status === "INTERVIEW" && (
        <button type="button" disabled={loadingStatus !== null} onClick={() => setEvaluationOpen(true)} className="rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-7 py-3 font-black text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-50">
          {interviewScore === null || interviewScore === undefined ? "تقييم المقابلة" : `تقييم المقابلة ${interviewScore}/100`}
        </button>
      )}

      {applicationType === "GANG" && (
        <button
          type="button"
          disabled={loadingStatus !== null || status === "TRIAL"}
          onClick={() => updateStatus("TRIAL")}
          className="rounded-2xl bg-cyan-400 px-7 py-3 font-black text-black transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "TRIAL" ? "في التجربة" : loadingStatus === "TRIAL" ? "جاري التجربة..." : "فترة تجربة"}
        </button>
      )}

      <button
        type="button"
        disabled={loadingStatus !== null}
        onClick={() => {
          setError("");
          setInterviewOpen(true);
        }}
        className="rounded-2xl bg-yellow-400 px-7 py-3 font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingStatus === "INTERVIEW" ? "جاري التحديد..." : "مقابلة"}
      </button>

      <button
        type="button"
        disabled={loadingStatus !== null}
        onClick={() => updateStatus("REJECTED")}
        className="rounded-2xl bg-red-500 px-7 py-3 font-black text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingStatus === "REJECTED" ? "جاري الرفض..." : "رفض"}
      </button>

      <button
        type="button"
        disabled={loadingStatus !== null}
        onClick={deleteApplication}
        className="rounded-2xl border border-white/15 bg-black/40 px-7 py-3 font-black text-gray-300 transition hover:border-white/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingStatus === "DELETE" ? "جاري الحذف..." : "حذف"}
      </button>

      {interviewOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby={`interview-title-${applicationId}`}>
          <form
            className="w-full max-w-xl overflow-hidden rounded-[28px] border border-yellow-400/25 bg-zinc-950 shadow-[0_35px_120px_rgba(0,0,0,0.8),0_0_45px_rgba(250,204,21,0.08)]"
            onSubmit={(event) => {
              event.preventDefault();
              if (!interviewAt) {
                setError("حدد تاريخ ووقت المقابلة");
                return;
              }
              void updateStatus("INTERVIEW", { at: new Date(interviewAt).toISOString(), note: interviewNote.trim(), internalNote: interviewInternalNote.trim(), assignedTo: interviewAssignee.trim() });
            }}
          >
            <div className="border-b border-white/10 bg-yellow-400/[0.06] p-6">
              <p className="text-[10px] font-black tracking-[3px] text-yellow-300">INTERVIEW SCHEDULER</p>
              <h3 id={`interview-title-${applicationId}`} className="mt-2 text-2xl font-black text-white">تحديد موعد المقابلة</h3>
              <p className="mt-2 text-sm leading-7 text-zinc-400">سيُحفظ الموعد ويصل للمتقدم برسالة Discord تلقائياً.</p>
            </div>
            <div className="grid gap-4 p-6">
              <label className="grid gap-2 text-sm font-black text-zinc-300">
                التاريخ والوقت
                <input type="datetime-local" required value={interviewAt} onChange={(event) => setInterviewAt(event.target.value)} className="rounded-2xl border border-white/15 bg-black px-4 py-3 text-white outline-none focus:border-yellow-400/50" />
              </label>
              <label className="grid gap-2 text-sm font-black text-zinc-300">
                مسؤول المقابلة
                <input value={interviewAssignee} onChange={(event) => setInterviewAssignee(event.target.value)} maxLength={120} className="rounded-2xl border border-white/15 bg-black px-4 py-3 text-white outline-none focus:border-cyan-400/50" placeholder="اسم أو Discord ID — الافتراضي أنت" />
              </label>
              <label className="grid gap-2 text-sm font-black text-zinc-300">
                رسالة للمتقدم
                <textarea value={interviewNote} onChange={(event) => setInterviewNote(event.target.value)} maxLength={500} className="min-h-24 rounded-2xl border border-white/15 bg-black px-4 py-3 font-normal leading-7 text-white outline-none focus:border-yellow-400/50" placeholder="مثال: ادخل روم الانتظار قبل الموعد بعشر دقائق" />
              </label>
              <label className="grid gap-2 text-sm font-black text-zinc-300">
                ملاحظة داخلية (اختياري)
                <textarea value={interviewInternalNote} onChange={(event) => setInterviewInternalNote(event.target.value)} maxLength={500} className="min-h-20 rounded-2xl border border-white/15 bg-black px-4 py-3 font-normal leading-7 text-white outline-none focus:border-cyan-400/50" />
              </label>
              {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-200">{error}</p>}
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <button type="button" disabled={loadingStatus !== null} onClick={() => setInterviewOpen(false)} className="flex-1 rounded-2xl border border-white/15 px-5 py-3 font-black text-zinc-300 transition hover:bg-white/5">إلغاء</button>
                <button disabled={loadingStatus !== null} className="flex-1 rounded-2xl bg-yellow-400 px-5 py-3 font-black text-black transition hover:bg-yellow-300 disabled:opacity-50">{loadingStatus === "INTERVIEW" ? "جاري الحفظ..." : "حفظ وإرسال الموعد"}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {evaluationOpen && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/90 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
          <form onSubmit={(event) => { event.preventDefault(); void saveInterviewEvaluation(); }} className="w-full max-w-xl overflow-hidden rounded-[28px] border border-cyan-400/25 bg-zinc-950 shadow-2xl">
            <div className="border-b border-white/10 bg-cyan-400/[0.06] p-6"><p className="text-[10px] font-black tracking-[3px] text-cyan-300">INTERVIEW INTELLIGENCE</p><h3 className="mt-2 text-2xl font-black">تقييم نتيجة المقابلة</h3></div>
            <div className="grid gap-4 p-6">
              <label className="grid gap-2 text-sm font-black text-zinc-300">الحضور<select value={attendance} onChange={(event) => setAttendance(event.target.value)} className="rounded-2xl border border-white/15 bg-black px-4 py-3"><option value="PRESENT">حضر</option><option value="ABSENT">لم يحضر</option><option value="RESCHEDULED">إعادة جدولة</option></select></label>
              <label className="grid gap-2 text-sm font-black text-zinc-300">التقييم من 100<input type="number" min="0" max="100" required value={score} onChange={(event) => setScore(event.target.value)} className="rounded-2xl border border-white/15 bg-black px-4 py-3 text-white outline-none" /></label>
              <label className="grid gap-2 text-sm font-black text-zinc-300">خلاصة المقابلة<textarea required maxLength={1000} value={evaluation} onChange={(event) => setEvaluation(event.target.value)} className="min-h-28 rounded-2xl border border-white/15 bg-black px-4 py-3 leading-7 text-white outline-none" placeholder="الانضباط، الخبرة، التواصل، القرار المقترح..." /></label>
              {error && <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{error}</p>}
              <div className="flex flex-col-reverse gap-3 sm:flex-row"><button type="button" onClick={() => setEvaluationOpen(false)} className="flex-1 rounded-2xl border border-white/15 px-5 py-3 font-black text-zinc-400">إلغاء</button><button disabled={loadingStatus !== null} className="flex-1 rounded-2xl bg-cyan-300 px-5 py-3 font-black text-black disabled:opacity-50">{loadingStatus === "EVALUATION" ? "جاري الحفظ..." : "حفظ التقييم"}</button></div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

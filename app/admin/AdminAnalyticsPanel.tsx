type Metric = {
  label: string;
  value: number;
  color: string;
  glow: string;
};

type AdminScore = {
  name: string;
  value: number;
};

export function AdminAnalyticsPanel({
  applications,
  accepted,
  rejected,
  warnings,
  summons,
  complaints,
  adminScores,
}: {
  applications: number;
  accepted: number;
  rejected: number;
  warnings: number;
  summons: number;
  complaints: number;
  adminScores: AdminScore[];
}) {
  const decisions = accepted + rejected;
  const acceptanceRate = decisions > 0 ? Math.round((accepted / decisions) * 100) : 0;
  const disciplineLoad = warnings + summons + complaints;
  const totalActivity = applications + decisions + disciplineLoad;
  const metrics: Metric[] = [
    { label: "التقديمات", value: applications, color: "from-amber-400 to-orange-500", glow: "shadow-amber-400/20" },
    { label: "القبول", value: accepted, color: "from-emerald-400 to-green-600", glow: "shadow-emerald-400/20" },
    { label: "الرفض", value: rejected, color: "from-rose-400 to-red-600", glow: "shadow-red-400/20" },
    { label: "التحذيرات", value: warnings, color: "from-yellow-300 to-yellow-600", glow: "shadow-yellow-400/20" },
    { label: "الاستدعاءات", value: summons, color: "from-cyan-300 to-blue-600", glow: "shadow-cyan-400/20" },
    { label: "الشكاوى", value: complaints, color: "from-fuchsia-400 to-purple-600", glow: "shadow-fuchsia-400/20" },
  ];
  const maxMetric = Math.max(1, ...metrics.map((metric) => metric.value));
  const maxAdminScore = Math.max(1, ...adminScores.map((score) => score.value));

  return (
    <div className="mt-6 grid gap-4 xl:grid-cols-[1.45fr_0.75fr]">
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/55 p-5 md:p-6">
        <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(34,211,238,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <p className="text-[10px] font-black tracking-[4px] text-cyan-300">OPERATIONAL ANALYTICS</p>
            <h4 className="mt-2 text-xl font-black text-white">نبض المنظومة خلال الفترة</h4>
          </div>
          <div className="text-left">
            <p className="text-4xl font-black text-white">{totalActivity}</p>
            <p className="mt-1 text-[10px] tracking-[2px] text-zinc-500">TOTAL SIGNALS</p>
          </div>
        </div>

        <div className="relative mt-6 grid gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="grid grid-cols-[72px_1fr_42px] items-center gap-3 sm:grid-cols-[95px_1fr_48px]">
              <p className="text-xs font-bold text-zinc-400">{metric.label}</p>
              <div className="h-2.5 overflow-hidden rounded-full border border-white/5 bg-white/[0.035]">
                <div
                  className={`h-full min-w-1 rounded-full bg-gradient-to-l ${metric.color} shadow-lg ${metric.glow}`}
                  style={{ width: `${Math.max(3, Math.round((metric.value / maxMetric) * 100))}%` }}
                />
              </div>
              <p className="font-mono text-sm font-black text-white">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="relative mt-7 grid grid-cols-3 gap-3">
          {[
            ["نسبة القبول", `${acceptanceRate}%`, "text-emerald-300"],
            ["قرارات مكتملة", decisions, "text-cyan-300"],
            ["ضغط الانضباط", disciplineLoad, disciplineLoad > 5 ? "text-red-300" : "text-yellow-200"],
          ].map(([label, value, color]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-3 text-center md:p-4">
              <p className={`text-xl font-black md:text-2xl ${color}`}>{value}</p>
              <p className="mt-1 text-[9px] font-bold text-zinc-600 md:text-[10px]">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-cyan-400/15 bg-[linear-gradient(145deg,rgba(8,47,73,0.22),rgba(0,0,0,0.72))] p-5 md:p-6">
        <p className="text-[10px] font-black tracking-[4px] text-cyan-300">ADMIN LEADERBOARD</p>
        <h4 className="mt-2 text-xl font-black text-white">نشاط فريق الإدارة</h4>
        <div className="mt-6 grid gap-3">
          {adminScores.map((score, index) => (
            <div key={`${score.name}-${index}`} className="rounded-2xl border border-white/10 bg-black/35 p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.07] font-mono text-[10px] font-black text-cyan-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm font-black text-zinc-200">{score.name}</p>
                </div>
                <p className="font-mono text-xl font-black text-white">{score.value}</p>
              </div>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gradient-to-l from-cyan-300 to-blue-600" style={{ width: `${Math.max(5, Math.round((score.value / maxAdminScore) * 100))}%` }} />
              </div>
            </div>
          ))}
          {adminScores.length === 0 && (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-zinc-600">لا يوجد نشاط إداري خلال الفترة.</div>
          )}
        </div>
      </div>
    </div>
  );
}

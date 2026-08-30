export default function AdminLoading() {
  return (
    <main dir="rtl" className="tokyo-dashboard relative min-h-screen overflow-hidden bg-black px-3 py-5 text-white sm:px-5 md:p-10">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[length:100%_6px,80px_80px] opacity-55" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(239,68,68,0.16),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(34,211,238,0.10),transparent_26%)]" />
      <div className="relative z-10 mx-auto max-w-7xl">
        <section className="tokyo-glass overflow-hidden rounded-3xl p-6 md:p-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-5">
            <div>
              <p className="text-xs font-black tracking-[5px] text-red-400">TOKYO ADMIN</p>
              <h1 className="mt-3 text-3xl font-black md:text-5xl">جاري فتح مركز القيادة</h1>
            </div>
            <span className="h-3 w-3 animate-pulse rounded-full bg-green-400 shadow-[0_0_18px_lime]" />
          </div>
          <div className="mt-6 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 animate-pulse bg-gradient-to-l from-red-500 via-white to-cyan-400" />
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="tokyo-glass h-28 animate-pulse rounded-2xl bg-white/[0.025] md:h-36 md:rounded-3xl" />
          ))}
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="tokyo-glass h-64 animate-pulse rounded-3xl bg-white/[0.025]" />
          <div className="tokyo-glass h-64 animate-pulse rounded-3xl bg-white/[0.025]" />
        </section>
      </div>
    </main>
  );
}

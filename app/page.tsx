"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SpeedInsights } from "@vercel/speed-insights/next";

const members = [
  ["سنتياغو كروز", "العقل المدبر"],
  ["لومي المخفي", "الشبح"],
  ["أبو صقير كروز", "الدب المميز"],
  ["ريد كروز", "الزرقاوي الأصيل"],
  ["سنفور كروز", "ابن القائد"],
  ["بابلو كروز", "ستريمرنا"],
  ["جوكر كروز", "مقاتل"],
  ["عبدو كروز", "مقاتل"],
  ["أبو فايز كروز", "مقاتل"],
  ["ريكاردو كروز", "مقاتل"],
  ["ادم كروز", "مقاتل"],
  ["ابو الليل كروز", "مقاتل"],
  ["دنقل كروز", "مقاتل"],
  ["زورو كروز", "مقاتل"],
  ["شلبي كروز", "مقاتل"],
  ["ايهم كروز", "مقاتل"],
  ["قصي كروز", "مقاتل"],
  ["ليبي كروز", "مقاتل"],
  ["مختار كروز", "مقاتل"],
  ["كلاشين كروز", "مقاتل"],
  ["مافيا كروز", "مقاتل"],
  ["امير كروز", "مقاتل"],
  ["زيد كروز", "مقاتل"],
  ["صقر كروز", "مقاتل"],
  ["شتخمص كروز", "مقاتل"],
  ["بشار كروز", "مقاتل"],
  ["أبو سند كروز", "مقاتل"],
  ["ريفن كروز", "مقاتل"],
  ["سراج كروز", "مقاتل"],
  ["ريموند كروز", "مقاتل"],
  ["وليد كروز", "مقاتل"],
];

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(40);
  const [search, setSearch] = useState("");
  const [rank, setRank] = useState("الكل");
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  const filteredMembers = members.filter(([name, role]) => {
    const matchesSearch = name.toLowerCase().includes(search.toLowerCase());
    const matchesRank = rank === "الكل" || role === rank;
    return matchesSearch && matchesRank;
  });

  const toggleMusic = () => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;

    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const changeVolume = (value: number) => {
    setVolume(value);
    if (audioRef.current) audioRef.current.volume = value / 100;
  };

  return (
    <main dir="rtl" className="min-h-screen bg-black text-white overflow-hidden cursor-none">
      <SpeedInsights />

      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 120, -120, 0],
            y: [0, -60, 60, 0],
            opacity: [0.08, 0.18, 0.08],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-[900px] h-[900px] bg-white/10 blur-[180px] rounded-full"
        />

        <motion.div
          animate={{
            x: [0, -100, 100, 0],
            y: [0, 80, -80, 0],
            opacity: [0.05, 0.14, 0.05],
          }}
          transition={{
            duration: 24,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-0 right-0 w-[1000px] h-[1000px] bg-white/10 blur-[200px] rounded-full"
        />
      </div>

      <motion.div
        className="pointer-events-none fixed z-[9999] w-8 h-8 rounded-full border border-white/60 shadow-[0_0_18px_white]"
        style={{ left: mouse.x - 16, top: mouse.y - 16 }}
      />

      <motion.div
        className="pointer-events-none fixed z-[9998] w-2 h-2 rounded-full bg-white shadow-[0_0_12px_white]"
        style={{ left: mouse.x - 4, top: mouse.y - 4 }}
      />

      <audio ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mpeg" />
      </audio>

      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center"
          >
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 text-green-400 tracking-[6px] font-bold drop-shadow-[0_0_12px_lime]"
            >
              ACCESS GRANTED
            </motion.p>

            <motion.h1
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-6xl md:text-9xl font-black tracking-[12px] drop-shadow-[0_0_35px_white]"
            >
              TOKYO
            </motion.h1>

            <p className="mt-4 tracking-[8px] text-gray-400">
              UNDERGROUND DATABASE LOADING
            </p>

            <div className="mt-8 w-64 h-1 bg-white/20 overflow-hidden rounded-full">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="h-full w-1/2 bg-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-black tracking-[5px]">TOKYO GANG</h1>
          <div className="hidden md:flex gap-8 text-sm text-gray-300">
            <a href="#home" className="hover:text-white">الرئيسية</a>
            <a href="#server" className="hover:text-white">السيرفر</a>
            <a href="#members" className="hover:text-white">الأعضاء</a>
            <a href="#database" className="hover:text-white">الملفات</a>
            <a href="#rules" className="hover:text-white">القوانين</a>
            <a href="#wars" className="hover:text-white">الحروب</a>
            <a href="#apply" className="hover:text-white">التقديم</a>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-6 left-6 z-50 bg-black/70 border border-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 w-52">
        <button onClick={toggleMusic} className="bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-300 transition">
          {playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
        </button>

        <div>
          <p className="text-xs text-gray-400 mb-2">مستوى الصوت: {volume}%</p>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => changeVolume(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <section id="home" className="relative flex flex-col items-center justify-center h-screen text-center px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-20 grayscale" />

        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1.18, x: [0, 20, -20, 0], y: [0, -12, 12, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 overflow-hidden"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-35 grayscale scale-110"
          >
            <source src="/bg.mp4" type="video/mp4" />
          </video>
        </motion.div>

        <div className="absolute inset-0 bg-black/75" />

        <motion.div
          animate={{ x: ["-20%", "20%"], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute -bottom-20 left-0 w-[700px] h-[300px] bg-white/10 blur-3xl rounded-full"
        />

        <motion.div
          animate={{ y: [40, -40, 40], opacity: [0.08, 0.22, 0.08] }}
          transition={{ duration: 9, repeat: Infinity }}
          className="absolute bottom-10 w-[900px] h-[180px] bg-white/10 blur-3xl rounded-full"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 120, rotateX: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1.6, ease: "easeOut" }}
          className="relative z-10"
        >
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "260px", opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2 }}
            className="mx-auto mb-6 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"
          />

          <motion.p
            initial={{ opacity: 0, y: 25, letterSpacing: "0px" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "8px" }}
            transition={{ delay: 0.7, duration: 1 }}
            className="mb-5 text-sm text-gray-300 drop-shadow-[0_0_10px_white]"
          >
            نَحْنُ لا نَستَسلِم نَنْتَصِر او نَمْوتْ
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, scale: 1.4, filter: "blur(14px)" }}
            animate={{
              opacity: 1,
              scale: 1,
              filter: "blur(0px)",
              x: [0, -2, 2, 0],
            }}
            transition={{
              opacity: { duration: 1 },
              scale: { duration: 1.3 },
              filter: { duration: 1.1 },
              x: { duration: 0.25, repeat: Infinity, repeatDelay: 3 },
            }}
            className="relative text-7xl md:text-9xl font-black text-white tracking-[10px] drop-shadow-[0_0_40px_white]"
          >
            <span className="absolute inset-0 text-white/20 translate-x-2 blur-[1px]">TOKYO</span>
            <span className="absolute inset-0 text-white/10 -translate-x-2">TOKYO</span>
            <span className="relative z-10">TOKYO</span>
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 50, letterSpacing: "0px" }}
            animate={{ opacity: 1, y: 0, letterSpacing: "10px" }}
            transition={{ delay: 0.5, duration: 1.2 }}
            className="text-5xl md:text-7xl font-bold text-gray-200 mt-2 drop-shadow-[0_0_20px_white]"
          >
            GANG
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 35 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 1 }}
            className="mt-6 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-9 bg-black/20 border border-white/10 rounded-3xl px-6 py-4 backdrop-blur-sm shadow-[0_0_30px_rgba(255,255,255,0.06)]"
          >
            أهلاً بك في الموقع الرسمي لعصابة TOKYO GANG. هنا يجتمع الولاء، الاحترام، والقوة داخل عالم فايف إم.
          </motion.p>

          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "340px", opacity: 1 }}
            transition={{ delay: 1.4, duration: 1.2 }}
            className="mx-auto mt-8 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent"
          />

          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              ["35", "عضو"],
              ["TOP 1", "GANG"],
              ["24/7", "سيطرة"],
              ["∞", "نفوذ"],
            ].map(([num, label]) => (
              <motion.div
                key={label}
                whileHover={{ scale: 1.05, y: -5 }}
                className="relative overflow-hidden bg-black/50 border border-white/20 rounded-2xl p-4 backdrop-blur-md group shadow-[0_0_18px_rgba(255,255,255,0.08)]"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-white/5" />

                <p className="relative z-10 text-3xl font-black drop-shadow-[0_0_14px_white]">
                  {num}
                </p>

                <p className="relative z-10 text-gray-400 text-sm mt-1">
                  {label}
                </p>

                <div className="relative z-10 mt-3 h-[1px] bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-60" />
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <a href="#apply" className="px-8 py-4 bg-white text-black hover:bg-gray-300 rounded-2xl text-lg font-bold transition hover:scale-105">
              تقديم انضمام
            </a>

            <a href="https://discord.gg/tok" target="_blank" className="px-8 py-4 border border-white hover:bg-white hover:text-black rounded-2xl text-lg font-bold transition hover:scale-105">
              دخول الديسكورد
            </a>
          </div>
        </motion.div>
      </section>

      <section className="relative overflow-hidden border-y border-white/10 bg-black py-4">
        <motion.div
          animate={{ x: ["100%", "-100%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="whitespace-nowrap text-sm md:text-base font-bold tracking-[4px] text-white/80"
        >
          ⚠ TOKYO GANG سيطرت على المنطقة الشرقية — ⚠ تم القضاء على أحد الخونة — ⚠ النفوذ يزداد يومياً — ⚠ TOP 1 GANG داخل السيرفر — ⚠ لا مكان للضعفاء داخل TOKYO —
        </motion.div>
      </section>

      <section id="server" className="py-24 px-6 bg-zinc-950 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm tracking-[6px] text-gray-400 mb-4">مكان تواجدنا حالياً</p>
            <h2 className="text-5xl font-black mb-6">INFINITE CITY CFW</h2>
            <p className="text-gray-300 text-lg leading-9">
              حالياً تتواجد عصابة TOKYO GANG داخل سيرفر INFINITE CITY CFW، حيث نفرض حضورنا وهيبتنا داخل عالم فايف إم.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="bg-black border border-white/20 rounded-[40px] p-10 shadow-[0_0_80px_rgba(255,255,255,0.08)]">
              <img src="/server-logo.png" alt="Server Logo" className="w-72 object-contain grayscale hover:grayscale-0 transition duration-500" />
            </div>
          </div>
        </div>
      </section>
      <section id="command" className="py-24 px-6 bg-black border-y border-white/10">
  <h2 className="text-5xl font-black text-center mb-4">القيادة العليا</h2>
  <p className="text-center text-gray-400 mb-14 tracking-[4px]">
    HIGH COMMAND
  </p>

  <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
    {[
      ["سيلفادور كروز", "القائد الأعلى"],
      ["توتي كروز", "الزعيم"],
      ["حمدان كروز", "نائب القائد"],
      ["برلين كروز", "نائب القائد"],
    ].map(([name, role], index) => (
      <motion.div
        key={name}
        initial={{ opacity: 0, y: 80, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.15, duration: 0.8 }}
        whileHover={{ scale: 1.07, y: -10 }}
        className="relative overflow-hidden bg-zinc-950 border border-white/20 rounded-[35px] p-8 text-center group shadow-[0_0_40px_rgba(255,255,255,0.08)]"
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 bg-gradient-to-br from-white/15 via-transparent to-white/5" />

        <div className="relative z-10">
          <div className="mx-auto mb-6 w-28 h-28 rounded-full bg-white text-black flex items-center justify-center text-4xl font-black shadow-[0_0_35px_white]">
            {name[0]}
          </div>

          <p className="text-xs tracking-[5px] text-gray-500 mb-3">
            HIGH COMMAND
          </p>

          <h3 className="text-3xl font-black text-white drop-shadow-[0_0_20px_white]">
            {name}
          </h3>

          <p className="mt-3 text-gray-400">{role}</p>

          <div className="mt-6 h-[2px] bg-gradient-to-r from-transparent via-white to-transparent" />

          <p className="mt-5 text-red-500 font-black tracking-[3px] drop-shadow-[0_0_12px_red]">
            AUTHORITY LEVEL: MAX
          </p>
        </div>
      </motion.div>
    ))}
  </div>
</section>

      <section id="members" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-6">أعضاء TOKYO GANG</h2>
        <p className="text-center text-gray-400 mb-10">قاعدة بيانات كاملة لأعضاء العصابة وعددهم 35 عضو</p>

        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 mb-10">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن عضو..."
            className="flex-1 bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none"
          />

          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none"
          >
            {["الكل", "القائد", "الزعيم", "نائب القائد", "العقل المدبر", "الشبح", "الدب المميز", "الزرقاوي الأصيل", "ابن القائد", "ستريمرنا", "مقاتل"].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredMembers.map(([name, role], index) => (
            <motion.div
              key={`${name}-${index}`}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: (index % 8) * 0.05 }}
              className="group relative overflow-hidden bg-zinc-950 border border-white/15 rounded-3xl p-6 hover:border-white transition duration-300"
            >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-white/10 to-transparent" />

              <div className="relative z-10">
                <div className="w-20 h-20 rounded-full bg-white text-black mx-auto mb-5 flex items-center justify-center font-black text-2xl">
                  {name[0]}
                </div>

                <h3 className="text-3xl md:text-4xl font-black text-center tracking-[4px] uppercase text-white drop-shadow-[0_0_18px_white] group-hover:scale-110 transition duration-300">
                  {name}
                </h3>

                <p className="text-center text-gray-400 mt-2">{role}</p>

                <div className="mt-6 space-y-4">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-green-400 font-bold drop-shadow-[0_0_8px_lime] animate-pulse">
                      ● متواجد
                    </span>

                    <span className="text-red-500 font-black tracking-[2px] drop-shadow-[0_0_12px_red]">
                      خطير جداً
                    </span>
                  </div>

                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "0%" }}
                      whileInView={{ width: "100%" }}
                      transition={{ duration: 2 }}
                      className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-500 to-white shadow-[0_0_20px_red]"
                    />
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 tracking-[2px]">
                    <span>THREAT LEVEL</span>
                    <span>MAXIMUM</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="database" className="py-24 px-6 bg-zinc-950">
        <h2 className="text-5xl font-black text-center mb-14">TOKYO DATABASE</h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-6">
          {[
            ["BLACKLIST", "قائمة الممنوعين"],
            ["WANTED", "المطلوبين"],
            ["OPERATIONS", "العمليات"],
            ["TERRITORIES", "المناطق"],
          ].map(([title, desc]) => (
            <div key={title} className="bg-black border border-white/20 rounded-3xl p-8 hover:scale-105 hover:border-white transition">
              <p className="text-3xl font-black tracking-[4px]">{title}</p>
              <p className="text-gray-400 mt-4">{desc}</p>
              <div className="mt-8 h-1 bg-white/20 rounded-full" />
            </div>
          ))}
        </div>
      </section>

      <section id="rules" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-14">قوانين العصابة</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {["الاحترام بين الأعضاء خط أحمر", "ممنوع الخيانة أو تسريب معلومات", "الالتزام بأوامر القيادة", "ممنوع التخريب بدون سبب", "الحضور وقت الاجتماعات مهم", "الهيبة قبل كل شيء"].map((rule, i) => (
            <div key={i} className="border border-white/20 bg-zinc-950 rounded-3xl p-6 text-center hover:border-white transition">
              {rule}
            </div>
          ))}
        </div>
      </section>

      <section id="wars" className="py-24 px-6 bg-zinc-950">
        <h2 className="text-5xl font-black text-center mb-14">سجل الحروب</h2>

        <div className="max-w-4xl mx-auto space-y-4">
          {["TOKYO GANG صار عالمي والقادم أعظم", "إعدام أول خائن", "فرضت السيطرة المباشرة بأراضي أنفنتي"].map((war, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 80 }}
              whileInView={{ opacity: 1, x: 0 }}
              className="bg-black border border-white/20 rounded-2xl p-5 flex justify-between"
            >
              <span>{war}</span>
              <span className="text-gray-500">2026</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="apply" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-8">تقديم الانضمام</h2>

        <form
          onSubmit={async (e) => {
            e.preventDefault();

            const form = e.currentTarget;
            const formData = new FormData(form);

            await fetch("/api/apply", {
              method: "POST",
              body: JSON.stringify({
                name: formData.get("name"),
                age: formData.get("age"),
                discord: formData.get("discord"),
                experience: formData.get("experience"),
                reason: formData.get("reason"),
              }),
            });

            alert("تم إرسال طلبك بنجاح");
            form.reset();
          }}
          className="max-w-2xl mx-auto grid gap-4"
        >
          <input name="name" required placeholder="اسمك داخل اللعبة" className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none" />
          <input name="age" required placeholder="عمرك" className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none" />
          <input name="discord" required placeholder="Discord ID" className="bg-zinc-950 border border-white/20 rounded-2xl p-4 outline-none" />
          <textarea name="experience" required placeholder="خبرتك في فايف إم" className="bg-zinc-950 border border-white/20 rounded-2xl p-4 h-32 outline-none" />
          <textarea name="reason" required placeholder="ليش بدك تنضم؟" className="bg-zinc-950 border border-white/20 rounded-2xl p-4 h-32 outline-none" />

          <button className="bg-white text-black rounded-2xl py-4 font-bold hover:bg-gray-300 transition">
            إرسال الطلب
          </button>
        </form>
      </section>

      <footer className="py-10 text-center text-gray-500 bg-black border-t border-white/10">
        Dev by Hamdan | TOKYO GANG © 2026
      </footer>
    </main>
  );
}
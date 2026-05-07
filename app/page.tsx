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

  const [mouse, setMouse] = useState({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setMouse({
        x: e.clientX,
        y: e.clientY,
      });
    };

    window.addEventListener("mousemove", move);

    return () => window.removeEventListener("mousemove", move);
  }, []);

  useEffect(() => {
    const startMusic = async () => {
      if (!audioRef.current) return;

      audioRef.current.volume = volume / 100;

      try {
        await audioRef.current.play();
        setPlaying(true);
      } catch (err) {
        console.log("Autoplay blocked");
      }
    };

    window.addEventListener("mousemove", startMusic, { once: true });
    window.addEventListener("click", startMusic, { once: true });

    return () => {
      window.removeEventListener("mousemove", startMusic);
      window.removeEventListener("click", startMusic);
    };
  }, []);

  const filteredMembers = members.filter(([name, role]) => {
    const matchesSearch = name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesRank =
      rank === "الكل" || role === rank;

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

    if (audioRef.current) {
      audioRef.current.volume = value / 100;
    }
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-black text-white overflow-hidden cursor-none"
    >
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
        style={{
          left: mouse.x - 16,
          top: mouse.y - 16,
        }}
      />

      <motion.div
        className="pointer-events-none fixed z-[9998] w-2 h-2 rounded-full bg-white shadow-[0_0_12px_white]"
        style={{
          left: mouse.x - 4,
          top: mouse.y - 4,
        }}
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
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="font-black tracking-[5px]">
            TOKYO GANG
          </h1>

          <div className="hidden md:flex gap-6 text-sm text-gray-300">
            <a href="#home">الرئيسية</a>
            <a href="#server">السيرفر</a>
            <a href="#command">القيادة</a>
            <a href="#streamers">الستريمرز</a>
            <a href="#members">الأعضاء</a>
            <a href="#wanted">المطلوبين</a>
            <a href="#apply">التقديم</a>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-6 left-6 z-50 bg-black/70 border border-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 w-52">
        <button
          onClick={toggleMusic}
          className="bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-300 transition"
        >
          {playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
        </button>

        <div>
          <p className="text-xs text-gray-400 mb-2">
            مستوى الصوت: {volume}%
          </p>

          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) =>
              changeVolume(Number(e.target.value))
            }
            className="w-full"
          />
        </div>
      </div>

      <section
        id="home"
        className="relative flex flex-col items-center justify-center h-screen text-center px-6 overflow-hidden"
      >
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{
            scale: 1.18,
            x: [0, 20, -20, 0],
            y: [0, -12, 12, 0],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 overflow-hidden"
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover opacity-60 grayscale scale-110"
          >
            <source src="/bg.mp4" type="video/mp4" />
          </video>
        </motion.div>

        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/70" />

        <div className="relative z-10">
          <h1 className="text-7xl md:text-9xl font-black tracking-[10px] drop-shadow-[0_0_40px_white]">
            TOKYO
          </h1>

          <h2 className="text-5xl md:text-7xl font-bold text-gray-200 mt-2">
            GANG
          </h2>

          <p className="mt-6 text-gray-200 text-lg md:text-xl max-w-2xl mx-auto leading-9 bg-black/25 border border-white/10 rounded-3xl px-6 py-4 backdrop-blur-sm">
            أهلاً بك في الموقع الرسمي لعصابة TOKYO GANG
          </p>
        </div>
      </section>

      <section
        id="streamers"
        className="py-24 px-6 bg-zinc-950 border-y border-white/10"
      >
        <h2 className="text-5xl font-black text-center mb-4">
          ستريمرز العصابة
        </h2>

        <p className="text-center text-gray-400 mb-14 tracking-[4px]">
          TOKYO MEDIA UNIT
        </p>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            {
              name: "بابلو كروز",
              role: "ستريمر رسمي",
              kick: "https://kick.com/pablo-jo",
              tiktok: "https://www.tiktok.com/@m2muon?is_from_webapp=1&sender_device=pc",
            },

            {
              name: "برلين كروز",
              role: "ستريمر رسمي",
              kick: "https://kick.com/br-berlin",
            },

            {
              name: "أبو فايز كروز",
              role: "ستريمر رسمي",
              kick: "https://kick.com/1abufayez1",
            },
          ].map((streamer, index) => (
            <motion.div
              key={streamer.name}
              initial={{ opacity: 0, y: 70 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15 }}
              whileHover={{ scale: 1.04, y: -8 }}
              className="relative overflow-hidden rounded-[35px] bg-black border border-white/20 p-8 text-center"
            >
              <div className="relative z-10">
                <div className="mx-auto mb-6 w-28 h-28 rounded-full bg-white text-black flex items-center justify-center text-4xl font-black">
                  ▶
                </div>

                <h3 className="text-3xl font-black text-white">
                  {streamer.name}
                </h3>

                <p className="mt-3 text-gray-400">
                  {streamer.role}
                </p>

                <div className="flex gap-3 justify-center mt-7 flex-wrap">
                  <a
                    href={streamer.kick}
                    target="_blank"
                    className="px-8 py-3 bg-white text-black rounded-2xl font-bold"
                  >
                    Kick
                  </a>

                  {streamer.tiktok && (
                    <a
                      href={streamer.tiktok}
                      target="_blank"
                      className="px-8 py-3 border border-pink-500 text-pink-400 rounded-2xl font-bold"
                    >
                      TikTok
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section
        id="wanted"
        className="py-24 px-6 bg-black border-y border-white/10"
      >
        <h2 className="text-5xl font-black text-center mb-4">
          MOST WANTED
        </h2>

        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {[
            ["C-1", "بلاك ليست ومطلوب"],
            ["F-0", "مطلوب"],
          ].map(([name, type]) => (
            <div
              key={name}
              className="rounded-[35px] bg-zinc-950 border border-red-500/35 p-8 text-center"
            >
              <h3 className="text-5xl font-black text-white">
                {name}
              </h3>

              <p className="mt-3 text-gray-400">
                {type}
              </p>

              <p className="mt-5 text-red-500 font-black">
                THREAT: MAXIMUM
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="py-10 text-center text-gray-500 bg-black border-t border-white/10">
        Dev by Hamdan | TOKYO GANG © 2026
      </footer>
    </main>
  );
}
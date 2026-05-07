"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(40);

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
    <main dir="rtl" className="min-h-screen bg-black text-white overflow-hidden">
      <audio ref={audioRef} loop>
        <source src="/music.mp3" type="audio/mpeg" />
      </audio>

      {/* Music Box */}
      <div className="fixed bottom-6 left-6 z-50 bg-black/70 border border-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 w-52">
        <button
          onClick={toggleMusic}
          className="bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-300 transition"
        >
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

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center h-screen text-center px-6 overflow-hidden">
        {/* Camera movement background */}
        <motion.div
          initial={{ scale: 1.15, x: 0, y: 0 }}
          animate={{ scale: 1.28, x: [0, 25, -25, 0], y: [0, -18, 18, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-25 grayscale"
        />

        <div className="absolute inset-0 bg-black/75" />

        {/* Smoke effects */}
        <motion.div
          animate={{ x: ["-20%", "20%"], opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-20 left-0 w-[700px] h-[300px] bg-white/10 blur-3xl rounded-full"
        />

        <motion.div
          animate={{ x: ["20%", "-20%"], opacity: [0.1, 0.25, 0.1] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 right-0 w-[600px] h-[260px] bg-white/10 blur-3xl rounded-full"
        />

        <motion.div
          animate={{ y: [40, -40, 40], opacity: [0.08, 0.22, 0.08] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-10 w-[900px] h-[180px] bg-white/10 blur-3xl rounded-full"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 100 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1.5 }}
          className="relative z-10"
        >
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mb-5 text-sm tracking-[8px] text-gray-300"
          >
            نَحْنُ لا نَستَسلِم نَنْتَصِر او نَمْوتْ
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, letterSpacing: "-20px" }}
            animate={{ opacity: 1, letterSpacing: "10px" }}
            transition={{ duration: 2 }}
            className="text-7xl md:text-9xl font-black text-white drop-shadow-[0_0_35px_white]"
          >
            TOKYO
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1.5 }}
            className="text-5xl md:text-7xl font-bold text-gray-200 mt-2 tracking-[10px]"
          >
            GANG
          </motion.h2>

          <p className="mt-6 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-9">
            أهلاً بك في الموقع الرسمي لعصابة TOKYO GANG.
            هنا يجتمع الولاء، الاحترام، والقوة داخل عالم فايف إم.
          </p>

          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <a className="px-8 py-4 bg-white text-black hover:bg-gray-300 rounded-2xl text-lg font-bold transition hover:scale-105">
              تقديم انضمام
            </a>

            <a className="px-8 py-4 border border-white hover:bg-white hover:text-black rounded-2xl text-lg font-bold transition hover:scale-105">
              دخول الديسكورد
            </a>
          </div>
        </motion.div>
      </section>

      {/* Server Location */}
      <section className="py-24 px-6 bg-zinc-950 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1 }}
          >
            <p className="text-sm tracking-[6px] text-gray-400 mb-4">
              مكان تواجدنا حالياً
            </p>

            <h2 className="text-5xl font-black mb-6">INFINITE CITY CFW</h2>

            <p className="text-gray-300 text-lg leading-9">
              حالياً تتواجد عصابة TOKYO GANG داخل سيرفر INFINITE CITY CFW،
              حيث نفرض حضورنا وهيبتنا داخل عالم فايف إم.
            </p>

            <a className="inline-block mt-8 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-300 transition">
              دخول السيرفر
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="flex justify-center"
          >
            <div className="bg-black border border-white/20 rounded-[40px] p-10 backdrop-blur-md shadow-[0_0_60px_rgba(255,255,255,0.08)]">
              <img
                src="/server-logo.png"
                alt="Server Logo"
                className="w-72 object-contain grayscale hover:grayscale-0 transition duration-500"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Members */}
      <section className="py-24 px-6 bg-black">
        <motion.h2
          initial={{ opacity: 0, y: 80 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-5xl font-bold text-center mb-16 text-white"
        >
          أعضاء العصابة
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {[
            ["TOKYO", "القائد"],
            ["SHADOW", "مقاتل"],
            ["DRIFT", "سائق"],
          ].map(([name, role], index) => (
            <motion.div
              key={name}
              initial={{ opacity: 0, y: 80 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2 }}
              className="bg-zinc-950 border border-white/20 rounded-3xl p-8 text-center hover:scale-105 hover:border-white transition duration-300"
            >
              <div className="w-24 h-24 mx-auto rounded-full bg-white mb-6" />
              <h3 className="text-3xl font-bold">{name}</h3>
              <p className="text-gray-400 mt-2">{role}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="py-10 text-center text-gray-500 bg-black border-t border-white/10">
        TOKYO GANG © 2025
      </footer>
    </main>
  );
}
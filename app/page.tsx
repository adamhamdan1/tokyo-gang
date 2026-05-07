"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(40);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2600);
    return () => clearTimeout(timer);
  }, []);

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
    <main dir="rtl" className="min-h-screen bg-black text-white overflow-hidden cursor-crosshair">
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
            <motion.h1
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1 }}
              className="text-6xl md:text-9xl font-black tracking-[12px] drop-shadow-[0_0_35px_white]"
            >
              TOKYO
            </motion.h1>
            <p className="mt-4 tracking-[8px] text-gray-400">LOADING GANG SYSTEM</p>
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
            <a href="#rules" className="hover:text-white">القوانين</a>
            <a href="#cars" className="hover:text-white">السيارات</a>
            <a href="#gallery" className="hover:text-white">المعرض</a>
            <a href="#wars" className="hover:text-white">الحروب</a>
          </div>
        </div>
      </nav>

      <div className="fixed bottom-6 left-6 z-50 bg-black/70 border border-white/20 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 w-52">
        <button onClick={toggleMusic} className="bg-white text-black font-bold rounded-xl py-3 hover:bg-gray-300 transition">
          {playing ? "إيقاف الموسيقى" : "تشغيل الموسيقى"}
        </button>
        <div>
          <p className="text-xs text-gray-400 mb-2">مستوى الصوت: {volume}%</p>
          <input type="range" min="0" max="100" value={volume} onChange={(e) => changeVolume(Number(e.target.value))} className="w-full" />
        </div>
      </div>

      <section id="home" className="relative flex flex-col items-center justify-center h-screen text-center px-6 overflow-hidden">
        <motion.div
          initial={{ scale: 1.15 }}
          animate={{ scale: 1.28, x: [0, 25, -25, 0], y: [0, -18, 18, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-[url('/bg.jpg')] bg-cover bg-center opacity-25 grayscale"
        />
        <div className="absolute inset-0 bg-black/75" />

        <motion.div animate={{ x: ["-20%", "20%"], opacity: [0.15, 0.35, 0.15] }} transition={{ duration: 10, repeat: Infinity }} className="absolute -bottom-20 left-0 w-[700px] h-[300px] bg-white/10 blur-3xl rounded-full" />
        <motion.div animate={{ y: [40, -40, 40], opacity: [0.08, 0.22, 0.08] }} transition={{ duration: 9, repeat: Infinity }} className="absolute bottom-10 w-[900px] h-[180px] bg-white/10 blur-3xl rounded-full" />

        <motion.div initial={{ opacity: 0, scale: 0.7, y: 100 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1.5 }} className="relative z-10">
          <p className="mb-5 text-sm tracking-[8px] text-gray-300">نَحْنُ لا نَستَسلِم نَنْتَصِر او نَمْوتْ</p>
          <h1 className="text-7xl md:text-9xl font-black text-white drop-shadow-[0_0_35px_white] tracking-[10px]">TOKYO</h1>
          <h2 className="text-5xl md:text-7xl font-bold text-gray-200 mt-2 tracking-[10px]">GANG</h2>
          <p className="mt-6 text-gray-300 text-lg md:text-xl max-w-2xl mx-auto leading-9">
            أهلاً بك في الموقع الرسمي لعصابة TOKYO GANG. هنا يجتمع الولاء، الاحترام، والقوة داخل عالم فايف إم.
          </p>
          <div className="mt-10 flex gap-4 justify-center flex-wrap">
            <a href="#apply" className="px-8 py-4 bg-white text-black hover:bg-gray-300 rounded-2xl text-lg font-bold transition hover:scale-105">تقديم انضمام</a>
            <a href="#" className="px-8 py-4 border border-white hover:bg-white hover:text-black rounded-2xl text-lg font-bold transition hover:scale-105">دخول الديسكورد</a>
          </div>
        </motion.div>
      </section>

      <section id="server" className="py-24 px-6 bg-zinc-950 border-t border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-sm tracking-[6px] text-gray-400 mb-4">مكان تواجدنا حالياً</p>
            <h2 className="text-5xl font-black mb-6">EMERGENT RP</h2>
            <p className="text-gray-300 text-lg leading-9">حالياً تتواجد عصابة TOKYO GANG داخل سيرفر EMERGENT RP، حيث نفرض حضورنا وهيبتنا داخل عالم فايف إم.</p>
          </div>
          <div className="flex justify-center">
            <div className="bg-black border border-white/20 rounded-[40px] p-10">
              <img src="/server-logo.png" alt="Server Logo" className="w-72 object-contain grayscale hover:grayscale-0 transition duration-500" />
            </div>
          </div>
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

      <section id="cars" className="py-24 px-6 bg-zinc-950">
        <h2 className="text-5xl font-black text-center mb-14">سيارات العصابة</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          {["DRIFT UNIT", "STREET CAR", "ESCAPE CAR"].map((car) => (
            <div key={car} className="rounded-3xl border border-white/20 bg-black p-8 text-center hover:scale-105 transition">
              <div className="h-40 rounded-2xl bg-white/10 mb-6 flex items-center justify-center text-gray-500">CAR IMAGE</div>
              <h3 className="text-2xl font-bold">{car}</h3>
            </div>
          ))}
        </div>
      </section>

      <section id="gallery" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-14">المعرض</h2>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6">
          {["/bg.jpg", "/bg.jpg", "/bg.jpg", "/bg.jpg", "/bg.jpg", "/bg.jpg"].map((img, i) => (
            <div key={i} className="h-64 rounded-3xl overflow-hidden border border-white/20">
              <img src={img} className="w-full h-full object-cover grayscale hover:grayscale-0 hover:scale-110 transition duration-500" />
            </div>
          ))}
        </div>
      </section>

      <section id="wars" className="py-24 px-6 bg-zinc-950">
        <h2 className="text-5xl font-black text-center mb-14">سجل الحروب</h2>
        <div className="max-w-4xl mx-auto space-y-4">
          {["TOKYO GANG سيطرت على المنطقة الشرقية", "عملية مطاردة ناجحة ضد خصم مجهول", "اجتماع قيادة لتوسيع النفوذ"].map((war, i) => (
            <div key={i} className="bg-black border border-white/20 rounded-2xl p-5 flex justify-between">
              <span>{war}</span>
              <span className="text-gray-500">2025</span>
            </div>
          ))}
        </div>
      </section>

      <section id="apply" className="py-24 px-6 bg-black">
        <h2 className="text-5xl font-black text-center mb-8">تقديم الانضمام</h2>
        <p className="text-center text-gray-400 mb-10">اضغط الزر وعبّي نموذج التقديم.</p>
        <div className="flex justify-center">
          <a href="#" className="px-10 py-4 bg-white text-black rounded-2xl font-bold hover:bg-gray-300 transition">
            فتح نموذج التقديم
          </a>
        </div>
      </section>

      <footer className="py-10 text-center text-gray-500 bg-black border-t border-white/10">
        TOKYO GANG © 2025
      </footer>
    </main>
  );
}
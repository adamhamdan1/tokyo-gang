import { ensureCommandSchema } from "@/lib/command-schema";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function VerifyMemberPage({ params }: { params: Promise<{ id: string }> }) {
  await ensureCommandSchema();
  const { id } = await params;
  const member = await prisma.tokyoMember.findUnique({ where: { id }, select: { displayName: true, username: true, image: true, inTokyoRole: true, status: true, internalRank: true, commandPoints: true, lastSyncedAt: true, achievements: { select: { achievement: { select: { title: true, icon: true } } } } } });
  if (!member) notFound();
  const verified = member.inTokyoRole && !["DISMISSED", "BLACKLISTED"].includes(member.status);
  return <main dir="rtl" className="tokyo-dashboard flex min-h-screen items-center justify-center p-5 text-white"><section className={`w-full max-w-xl rounded-[34px] border p-7 text-center shadow-2xl ${verified ? "border-green-400/30 bg-green-400/[0.06]" : "border-red-400/30 bg-red-400/[0.06]"}`}><p className={`text-xs font-black tracking-[5px] ${verified ? "text-green-300" : "text-red-300"}`}>TOKYO ID VERIFICATION</p>{member.image&&<Image src={member.image} alt={member.displayName} width={110} height={110} className="mx-auto mt-6 h-28 w-28 rounded-[28px] border border-white/20 object-cover"/>}<h1 className="mt-5 text-4xl font-black">{member.displayName}</h1><p className="mt-2 text-zinc-500">@{member.username}</p><div className={`mx-auto mt-6 w-fit rounded-full px-5 py-2 font-black ${verified ? "bg-green-400 text-black" : "bg-red-500 text-white"}`}>{verified ? "عضوية TOKYO موثّقة" : "العضوية غير فعالة"}</div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/10 bg-black/35 p-4"><p className="text-xs text-zinc-600">الرتبة</p><p className="mt-2 font-black">{member.internalRank}</p></div><div className="rounded-2xl border border-white/10 bg-black/35 p-4"><p className="text-xs text-zinc-600">النقاط</p><p className="mt-2 font-black">{member.commandPoints} XP</p></div></div><div className="mt-5 flex flex-wrap justify-center gap-2">{member.achievements.map(({achievement})=><span key={achievement.title} className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-200">{achievement.icon} {achievement.title}</span>)}</div><p className="mt-6 text-xs text-zinc-600">آخر مزامنة: {member.lastSyncedAt.toLocaleString("ar")}</p><Link href="/" className="mt-6 inline-flex rounded-2xl border border-white/15 px-6 py-3 font-black text-zinc-300">الموقع الرسمي</Link></section></main>;
}

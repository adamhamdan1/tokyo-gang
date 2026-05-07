import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],

 callbacks: {
  async signIn({ profile }) {
    const p = profile as any;
    if (!p?.id) return false;

    await prisma.user.upsert({
      where: {
        discordId: p.id,
      },
      update: {
        username: p.username,
        image: p.image ?? null,
      },
      create: {
        discordId: p.id,
        username: p.username,
        image: p.image ?? null,
      },
    });

    return true;
  },

  async session({ session, token }) {
    if (session.user) {
      (session.user as any).id = token.sub!;
    }

    return session;
  },
},
});
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
      if (!profile) return false;

      await prisma.user.upsert({
        where: {
          discordId: profile.id as string,
        },
        update: {
          username: profile.username as string,
          image: profile.image as string | null,
        },
        create: {
          discordId: profile.id as string,
          username: profile.username as string,
          image: profile.image as string | null,
        },
      });

      return true;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
      }

      return session;
    },
  },
});
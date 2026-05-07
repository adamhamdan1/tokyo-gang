import NextAuth from "next-auth";
import type { DefaultSession } from "next-auth";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

type DiscordProfile = {
  id?: string;
  username?: string;
  image?: string | null;
};

type TokenWithDiscordId = {
  sub?: string;
  discordId?: string;
};

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],

 callbacks: {
  async signIn({ profile }) {
    const p = profile as DiscordProfile;
    if (!p?.id) return false;
    const username = p.username ?? "Discord User";

    await prisma.user.upsert({
      where: {
        discordId: p.id,
      },
      update: {
        username,
        image: p.image ?? null,
      },
      create: {
        discordId: p.id,
        username,
        image: p.image ?? null,
      },
    });

    return true;
  },

  async jwt({ token, profile }) {
    const p = profile as DiscordProfile | undefined;
    const nextToken = token as TokenWithDiscordId;

    if (p?.id) {
      nextToken.discordId = p.id;
    }

    return token;
  },

  async session({ session, token }) {
    const nextToken = token as TokenWithDiscordId;
    const discordId = nextToken.discordId ?? nextToken.sub;

    if (session.user && discordId) {
      session.user.id = discordId;
    }

    return session;
  },
},
});

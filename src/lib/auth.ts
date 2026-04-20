import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import { getServerSession, type DefaultSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { verifyFirebaseToken } from "@/lib/firebase-verify";

/* ── NextAuth type extensions ───────────────────────────────── */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: UserRole;
    } & DefaultSession["user"];
  }
  interface User {
    id: string;
    role?: UserRole;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

/* ── Helpers ────────────────────────────────────────────────── */
function adminEmailSet() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
  );
}

function resolveRole(email: string | null | undefined): UserRole {
  return email && adminEmailSet().has(email.toLowerCase()) ? UserRole.ADMIN : UserRole.USER;
}

/* ── Auth options ───────────────────────────────────────────── */
export const authOptions: NextAuthOptions = {
  // PrismaAdapter persists User + Account records; Session table is unused with JWT strategy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma) as any,

  secret: process.env.NEXTAUTH_SECRET,

  // JWT strategy: session stored in a signed cookie — works with both OAuth + Credentials
  session: { strategy: "jwt" },

  providers: [
    /* ── 1. Firebase Google Sign-In (primary) ───────────────── */
    CredentialsProvider({
      id: "firebase",
      name: "Google (Firebase)",
      credentials: {
        idToken: { label: "Firebase ID Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.idToken) return null;

        // Verify the Firebase ID token via REST API (no Admin SDK needed)
        const fbUser = await verifyFirebaseToken(credentials.idToken);
        if (!fbUser?.email) return null;

        const role = resolveRole(fbUser.email);

        // Upsert the user in Prisma
        const user = await prisma.user.upsert({
          where: { email: fbUser.email },
          update: {
            name: fbUser.displayName ?? undefined,
            image: fbUser.photoUrl ?? undefined,
            emailVerified: new Date(),
            role,
          },
          create: {
            email: fbUser.email,
            name: fbUser.displayName ?? null,
            image: fbUser.photoUrl ?? null,
            emailVerified: new Date(),
            role,
          },
        });

        // Ensure profile row exists
        await prisma.profile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });

        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),

    /* ── 2. NextAuth Google OAuth (fallback / legacy) ───────── */
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    /* signIn — runs only for OAuth providers (not Credentials) */
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.id) return false;
        const role = resolveRole(user.email);
        await prisma.user.update({ where: { id: user.id }, data: { role } });
        await prisma.profile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
      }
      return true;
    },

    /* jwt — called on sign-in and every session access */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // For CredentialsProvider: role is already on the user object
        // For GoogleProvider: role might not be set yet, fetch from DB
        if (user.role) {
          token.role = user.role;
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true },
          });
          token.role = dbUser?.role ?? UserRole.USER;
        }
      }
      return token;
    },

    /* session — shapes the session object exposed to the app */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role ?? UserRole.USER;
      }
      return session;
    },
  },

  pages: {
    signIn: "/signin",
    error: "/signin",
  },
};

/* ── Convenience helpers ────────────────────────────────────── */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!isElevatedRole(user.role)) redirect("/dashboard");
  return user;
}

export function isElevatedRole(role: UserRole) {
  return role === UserRole.ADMIN;
}

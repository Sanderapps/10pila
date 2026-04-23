import type { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { logError, logInfo, logWarn } from "@/lib/utils/ops-log";

const providers: NextAuthOptions["providers"] = [
  CredentialsProvider({
    name: "Email e senha",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" }
    },
    async authorize(credentials) {
      const email = credentials?.email?.toLowerCase().trim();
      const password = credentials?.password;

      if (!email || !password) {
        logWarn("auth.credentials.missing_fields");
        return null;
      }

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user?.passwordHash) {
        logWarn("auth.credentials.user_missing_or_social_only", { email });
        return null;
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);

      if (!isValid) {
        logWarn("auth.credentials.invalid_password", {
          userId: user.id,
          email
        });
        return null;
      }

      logInfo("auth.credentials.authorized", {
        userId: user.id,
        role: user.role
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      };
    }
  })
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  );
}

if (process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
      allowDangerousEmailAccountLinking: true
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/login"
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const userRole = (user as { role?: "USER" | "ADMIN" }).role;
        token.id = user.id;

        if (userRole) {
          token.role = userRole;
        }
      }

      if ((!token.role || !token.id) && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true, role: true }
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }

      return session;
    }
  },
  events: {
    async signIn(message) {
      logInfo("auth.sign_in", {
        userId: message.user.id,
        provider: message.account?.provider ?? "unknown",
        isNewUser: message.isNewUser
      });
    }
  },
  logger: {
    error(code, metadata) {
      logError("auth.nextauth.error", { code, metadata });
    },
    warn(code) {
      logWarn("auth.nextauth.warn", { code });
    },
    debug(code, metadata) {
      logInfo("auth.nextauth.debug", { code, metadata });
    }
  },
  secret: process.env.AUTH_SECRET
};

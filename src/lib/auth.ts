import NextAuth, { type DefaultSession } from "next-auth"
import type { JWT } from "next-auth/jwt"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: "ADMIN" | "STAFF"
      adminId: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: "ADMIN" | "STAFF"
    adminId: string | null
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validUser = process.env.ADMIN_USERNAME ?? "admin"
        const validPass = process.env.ADMIN_PASSWORD ?? "admin1234"

        if (credentials?.username !== validUser || credentials?.password !== validPass) {
          return null
        }

        // Find or create the superadmin user record
        const user = await prisma.user.upsert({
          where: { email: "admin@daily-note.local" },
          update: {},
          create: {
            email: "admin@daily-note.local",
            name: "Super Admin",
            role: "ADMIN",
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          adminId: user.adminId,
        }
      },
    }),
  ],
  // JWT required for CredentialsProvider; Google OAuth still works fine with JWT
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? token.id
        token.role = (user as { role?: "ADMIN" | "STAFF" }).role ?? "ADMIN"
        token.adminId = (user as { adminId?: string | null }).adminId ?? null
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.user.adminId = token.adminId
      return session
    },
  },
  pages: { signIn: "/login" },
})

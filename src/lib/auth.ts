import NextAuth, { type DefaultSession } from "next-auth"
import type {} from "next-auth/jwt"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import { authConfig } from "@/lib/auth.config"

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
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  providers: [
    ...authConfig.providers.filter((p) => p.id !== "credentials"),
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
})

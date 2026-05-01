import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
  providers: [
    Google({ allowDangerousEmailAccountLinking: true }),
    // Authorize stub — actual DB lookup happens in auth.ts (Node.js runtime only).
    // The edge middleware only reads the JWT; it never calls authorize.
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize() {
        return null
      },
    }),
  ],
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
      session.user.id = token.id as string
      session.user.role = token.role as "ADMIN" | "STAFF"
      session.user.adminId = token.adminId as string | null
      return session
    },
  },
  pages: { signIn: "/login" },
} satisfies NextAuthConfig

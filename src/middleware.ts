import { getToken } from "next-auth/jwt"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  })

  const isAuthenticated = !!token
  const { pathname } = request.nextUrl

  // Already on login page and not authenticated — allow through
  if (pathname.startsWith("/login") && !isAuthenticated) {
    return NextResponse.next()
  }

  // Not authenticated — redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated and trying to access login — redirect to dashboard
  if (pathname.startsWith("/login") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|workbox-.*|worker-.*).*)",
  ],
}

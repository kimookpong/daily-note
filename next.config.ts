import type { NextConfig } from "next"
import withPWA from "@ducanh2912/next-pwa"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
}

export default withPWA({
  dest: "public",
  // Disable PWA on Vercel (build-time env var VERCEL=1) due to a known
  // incompatibility between next-pwa and App Router route groups (e.g. (app))
  // that causes an ENOENT lstat error on page_client-reference-manifest.js.
  disable: process.env.NODE_ENV === "development" || !!process.env.VERCEL,
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    skipWaiting: true,
  },
})(nextConfig)

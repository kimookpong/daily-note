import type { Metadata, Viewport } from "next"
import { Sarabun } from "next/font/google"
import "./globals.css"

const sarabun = Sarabun({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sarabun",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Daily Note — บันทึกประจำวัน",
  description: "ระบบบันทึกข้อมูลชุมชน กิจกรรม ปัญหา และค่าใช้จ่ายสำหรับสมาชิกสภาเทศบาล",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Daily Note",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={sarabun.variable}>
      <head>
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased min-h-screen bg-background">
        {children}
      </body>
    </html>
  )
}

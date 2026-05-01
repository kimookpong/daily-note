import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { SyncProvider } from "@/components/layout/SyncProvider"
import { PWAInstallBanner } from "@/components/layout/PWAInstallBanner"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <SyncProvider>
      <div className="h-dvh bg-[#F0F5FF] flex flex-col overflow-hidden">
        <Navbar user={session.user} />
        <main className="flex-1 min-h-0 overflow-y-auto">
          <div className="container mx-auto max-w-2xl w-full px-4 py-5 pb-28 md:pb-6">
            {children}
          </div>
        </main>
        <PWAInstallBanner />
      </div>
    </SyncProvider>
  )
}

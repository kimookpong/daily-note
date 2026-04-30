import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Navbar } from "@/components/layout/Navbar"
import { SyncProvider } from "@/components/layout/SyncProvider"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <SyncProvider>
      <div className="min-h-screen bg-[#F0F5FF] flex flex-col">
        <Navbar user={session.user} />
        <main className="flex-1 container mx-auto max-w-2xl w-full px-4 py-5 pb-28 md:pb-6">
          {children}
        </main>
      </div>
    </SyncProvider>
  )
}

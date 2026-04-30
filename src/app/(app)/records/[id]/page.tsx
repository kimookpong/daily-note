import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RecordDetailClient } from "@/components/records/RecordDetailClient"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "แก้ไขบันทึก — Daily Note" }

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RecordDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const { id } = await params

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Back navigation */}
      <Link
        href="/records"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <RecordDetailClient localId={id} userId={session.user.id} />
    </div>
  )
}

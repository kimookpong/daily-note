import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RecordForm } from "@/components/records/RecordForm"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "เพิ่มบันทึกใหม่ — Daily Note" }

export default async function NewRecordPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = session.user.id

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      {/* Back navigation */}
      <Link
        href="/records"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        กลับ
      </Link>

      <div>
        <h1 className="text-2xl font-black text-slate-900">เพิ่มบันทึกใหม่</h1>
        <p className="text-slate-400 text-xs mt-0.5">
          บันทึกลงเครื่องก่อน ซิงค์เมื่อออนไลน์
        </p>
      </div>

      <RecordForm userId={userId} />
    </div>
  )
}

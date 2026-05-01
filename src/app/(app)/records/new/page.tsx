import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecordForm } from "@/components/records/RecordForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "เพิ่มบันทึกใหม่ — Daily Note" };

export default async function NewRecordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.id;

  return (
    <div className="space-y-2 max-w-2xl mx-auto">
      <div className="p-2">
        <div className="flex items-center gap-2">
          <Link
            href="/records"
            className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-black text-slate-900">เพิ่มบันทึกใหม่</h1>
        </div>
        <p className="text-slate-400 text-sm mt-0.5 ml-7">
          บันทึกลงเครื่องก่อน ซิงค์เมื่อออนไลน์
        </p>
      </div>

      <RecordForm userId={userId} />
    </div>
  );
}

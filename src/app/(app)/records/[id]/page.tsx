import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { RecordDetailClient } from "@/components/records/RecordDetailClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "แก้ไขบันทึก — Daily Note" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RecordDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;

  return (
    <div className="space-y-3 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Link
          href="/records"
          className="text-slate-400 hover:text-slate-700 transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-black text-slate-900">แก้ไขบันทึก</h1>
      </div>

      <RecordDetailClient localId={id} userId={session.user.id} />
    </div>
  );
}

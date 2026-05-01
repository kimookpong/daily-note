"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { getDB } from "@/lib/local-db";
import { RecordForm } from "./RecordForm";
import { Loader2, FileX } from "lucide-react";
import Link from "next/link";

interface RecordDetailClientProps {
  localId: string;
  userId: string;
}

export function RecordDetailClient({
  localId,
  userId,
}: RecordDetailClientProps) {
  const record = useLiveQuery(async () => {
    const db = getDB();
    return db.records.get(localId);
  }, [localId]);

  // Loading state (undefined = query in flight)
  if (record === undefined) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-md">กำลังโหลด...</p>
      </div>
    );
  }

  // Not found or soft-deleted
  if (!record || record.deleted) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16  bg-slate-100 flex items-center justify-center">
          <FileX className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <p className="font-medium text-slate-700">ไม่พบบันทึกนี้</p>
          <p className="text-slate-400 text-md mt-1">
            อาจถูกลบไปแล้วหรือ localId ไม่ถูกต้อง
          </p>
        </div>
        <Link
          href="/records"
          className="text-blue-600 text-md hover:underline mt-2"
        >
          กลับไปรายการ
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="px-2">
        <h1 className="text-xl font-bold text-slate-900 line-clamp-2">
          {record.title}
        </h1>
      </div>

      <RecordForm userId={userId} existingRecord={record} />
    </div>
  );
}

import Link from "next/link";
import {
  Cloud,
  CloudOff,
  AlertCircle,
  MapPin,
  Tag,
  Banknote,
} from "lucide-react";
import type { LocalRecord } from "@/lib/local-db";
import {
  RECORD_TYPE_LABELS,
  RECORD_STATUS_LABELS,
  RECORD_STATUS_COLORS,
} from "@/types";
import type { RecordType, RecordStatus } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

const URGENCY_BORDER: Record<string, string> = {
  LOW: "border-l-slate-300",
  NORMAL: "border-l-blue-400",
  HIGH: "border-l-orange-400",
  CRITICAL: "border-l-red-500",
};

const URGENCY_DOT: Record<string, string> = {
  LOW: "bg-slate-300",
  NORMAL: "bg-blue-400",
  HIGH: "bg-orange-400",
  CRITICAL: "bg-red-500",
};

function SyncDot({ status }: { status: LocalRecord["syncStatus"] }) {
  if (status === "synced")
    return <Cloud className="w-3.5 h-3.5 text-green-400" />;
  if (status === "error")
    return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  return <CloudOff className="w-3.5 h-3.5 text-amber-400" />;
}

export function RecordCard({ record }: { record: LocalRecord }) {
  const statusColor =
    RECORD_STATUS_COLORS[record.status as RecordStatus] ??
    "bg-slate-100 text-slate-600";
  const totalExpenses = record.expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Link
      href={`/records/${record.localId}`}
      className={cn(
        "block bg-white rounded-xl shadow-sm border-l-4 pl-4 pr-3 py-3 hover:shadow-md transition-all active:scale-[0.99]",
        URGENCY_BORDER[record.urgency] ?? "border-l-slate-200",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0 mt-0.5",
              URGENCY_DOT[record.urgency],
            )}
          />
          <h3 className="font-semibold text-slate-900 text-base leading-snug line-clamp-1">
            {record.title}
          </h3>
        </div>
        <SyncDot status={record.syncStatus} />
      </div>

      {record.description && (
        <p className="text-slate-400 text-sm mb-2 line-clamp-2 ml-4">
          {record.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 ml-4">
        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-[#EEF3FF] text-[#1B3B6F]">
          {RECORD_TYPE_LABELS[record.type as RecordType] ?? record.type}
        </span>
        <span
          className={cn(
            "text-sm font-medium px-2 py-0.5 rounded-full",
            statusColor,
          )}
        >
          {RECORD_STATUS_LABELS[record.status as RecordStatus] ?? record.status}
        </span>

        <div className="ml-auto flex items-center gap-2 text-sm text-slate-400">
          {record.location && (
            <span className="flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              <span className="hidden sm:inline truncate max-w-[80px]">
                {record.location}
              </span>
            </span>
          )}
          {record.tags.length > 0 && (
            <span className="flex items-center gap-0.5">
              <Tag className="w-3 h-3" />
              {record.tags[0]}
              {record.tags.length > 1 && ` +${record.tags.length - 1}`}
            </span>
          )}
          {totalExpenses > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
              <Banknote className="w-3 h-3" />฿
              {totalExpenses.toLocaleString("th-TH")}
            </span>
          )}
        </div>
      </div>

      <p className="text-sm text-slate-300 mt-1.5 ml-4">
        {formatDateTime(record.deviceUpdatedAt)}
      </p>
    </Link>
  );
}

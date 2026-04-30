// Re-export local DB types
export type { LocalRecord, LocalExpense, LocalCommunityDetail, LocalRecordUpdate, SyncStatus } from "@/lib/local-db"

// ─── Enums ───────────────────────────────────────────────────────────────────

export type RecordType = "ISSUE" | "ACTIVITY" | "FIELD_WORK" | "COMMUNITY" | "OTHER"
export type RecordStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED"
export type Urgency = "LOW" | "NORMAL" | "HIGH" | "CRITICAL"
export type CommunityEventType = "FUNERAL" | "WEDDING" | "RELIGIOUS" | "VISIT" | "OTHER"
export type UserRole = "ADMIN" | "STAFF"

// ─── Thai label maps ─────────────────────────────────────────────────────────

export const RECORD_TYPE_LABELS: Record<RecordType, string> = {
  ISSUE: "ปัญหา / ข้อร้องเรียน",
  ACTIVITY: "กิจกรรม",
  FIELD_WORK: "ลงพื้นที่",
  COMMUNITY: "งานชุมชน",
  OTHER: "อื่นๆ",
}

export const RECORD_STATUS_LABELS: Record<RecordStatus, string> = {
  PENDING: "รอดำเนินการ",
  IN_PROGRESS: "กำลังดำเนินการ",
  RESOLVED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
}

export const URGENCY_LABELS: Record<Urgency, string> = {
  LOW: "ต่ำ",
  NORMAL: "ปกติ",
  HIGH: "สูง",
  CRITICAL: "เร่งด่วนมาก",
}

export const COMMUNITY_EVENT_TYPE_LABELS: Record<CommunityEventType, string> = {
  FUNERAL: "งานศพ",
  WEDDING: "งานแต่งงาน",
  RELIGIOUS: "งานบุญ / ศาสนา",
  VISIT: "เยี่ยมเยียน",
  OTHER: "อื่นๆ",
}

// ─── Color maps (Tailwind class strings) ─────────────────────────────────────

export const RECORD_TYPE_COLORS: Record<RecordType, string> = {
  ISSUE: "bg-red-100 text-red-800",
  ACTIVITY: "bg-blue-100 text-blue-800",
  FIELD_WORK: "bg-green-100 text-green-800",
  COMMUNITY: "bg-purple-100 text-purple-800",
  OTHER: "bg-gray-100 text-gray-800",
}

export const RECORD_STATUS_COLORS: Record<RecordStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_PROGRESS: "bg-blue-100 text-blue-800",
  RESOLVED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-600",
}

export const URGENCY_COLORS: Record<Urgency, string> = {
  LOW: "bg-slate-100 text-slate-700",
  NORMAL: "bg-sky-100 text-sky-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
}

// ─── API response types ───────────────────────────────────────────────────────

export interface DashboardStats {
  totalRecords: number
  pendingRecords: number
  byType: { type: RecordType; count: number }[]
  byStatus: { status: RecordStatus; count: number }[]
  monthlyExpenses: number
}

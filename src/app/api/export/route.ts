import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/export
 * Returns a flat JSON array of all records suitable for xlsx export.
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.adminId ?? session.user.id

  const records = await prisma.record.findMany({
    where: { createdById: userId },
    include: {
      communityDetail: true,
      expenses: true,
      updates: true,
      village: { select: { name: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const TYPE_LABELS: Record<string, string> = {
    ISSUE: "ปัญหา / ข้อร้องเรียน",
    ACTIVITY: "กิจกรรม",
    FIELD_WORK: "ลงพื้นที่",
    COMMUNITY: "งานชุมชน",
    OTHER: "อื่นๆ",
  }
  const STATUS_LABELS: Record<string, string> = {
    PENDING: "รอดำเนินการ",
    IN_PROGRESS: "กำลังดำเนินการ",
    RESOLVED: "เสร็จสิ้น",
    CANCELLED: "ยกเลิก",
  }
  const URGENCY_LABELS: Record<string, string> = {
    LOW: "ต่ำ",
    NORMAL: "ปกติ",
    HIGH: "สูง",
    CRITICAL: "เร่งด่วนมาก",
  }

  const flat = records.map((r) => {
    const totalExpenses = r.expenses.reduce((sum, e) => sum + Number(e.amount), 0)

    return {
      id: r.id,
      localId: r.localId,
      title: r.title,
      description: r.description ?? "",
      type: TYPE_LABELS[r.type] ?? r.type,
      status: STATUS_LABELS[r.status] ?? r.status,
      urgency: URGENCY_LABELS[r.urgency] ?? r.urgency,
      location: r.location ?? "",
      tags: r.tags.join(", "),
      village: r.village?.name ?? "",
      createdBy: r.createdBy.name ?? r.createdBy.email ?? "",
      // Community detail
      communityEventType: r.communityDetail?.eventType ?? "",
      communityHost: r.communityDetail?.host ?? "",
      communityConversation: r.communityDetail?.conversation ?? "",
      communityNeeds: r.communityDetail?.needs ?? "",
      // Expenses
      totalExpenses,
      expenseCount: r.expenses.length,
      // Updates
      updateCount: r.updates.length,
      // Dates
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      deviceUpdatedAt: r.deviceUpdatedAt.toISOString(),
      lastSyncedAt: r.lastSyncedAt?.toISOString() ?? "",
    }
  })

  return NextResponse.json(flat, {
    headers: {
      "Content-Disposition": `attachment; filename="daily-note-export-${Date.now()}.json"`,
      "Content-Type": "application/json",
    },
  })
}

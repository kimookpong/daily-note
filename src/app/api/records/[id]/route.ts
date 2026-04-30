import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const UpdateRecordSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  type: z.enum(["ISSUE", "ACTIVITY", "FIELD_WORK", "COMMUNITY", "OTHER"]).optional(),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED"]).optional(),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).optional(),
  images: z.array(z.string()).optional(),
  location: z.string().optional(),
  tags: z.array(z.string()).optional(),
  villageId: z.string().optional(),
  assignedToId: z.string().optional(),
  deviceUpdatedAt: z.string().datetime().optional(),
  communityDetail: z
    .object({
      eventType: z.enum(["FUNERAL", "WEDDING", "RELIGIOUS", "VISIT", "OTHER"]),
      host: z.string().optional(),
      conversation: z.string().optional(),
      needs: z.string().optional(),
    })
    .optional()
    .nullable(),
  expenses: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string(),
        amount: z.number(),
        receiptUrl: z.string().optional(),
        date: z.string(),
      })
    )
    .optional(),
})

async function getOwnerAndRecord(serverId: string, userId: string) {
  const record = await prisma.record.findFirst({
    where: { id: serverId, createdById: userId },
    include: { communityDetail: true, expenses: true, updates: true },
  })
  return record
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.adminId ?? session.user.id
  const { id } = await params

  const record = await getOwnerAndRecord(id, userId)
  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(record)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.adminId ?? session.user.id
  const { id } = await params

  const existing = await getOwnerAndRecord(id, userId)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = UpdateRecordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  // Handle community detail upsert / delete
  let communityDetailOp = {}
  if (data.communityDetail === null) {
    communityDetailOp = { communityDetail: { delete: true } }
  } else if (data.communityDetail) {
    communityDetailOp = {
      communityDetail: {
        upsert: {
          create: data.communityDetail,
          update: data.communityDetail,
        },
      },
    }
  }

  // Handle expenses: delete all and recreate (simple strategy)
  let expensesOp = {}
  if (data.expenses !== undefined) {
    expensesOp = {
      expenses: {
        deleteMany: {},
        create: data.expenses.map((e) => ({
          description: e.description,
          amount: e.amount,
          receiptUrl: e.receiptUrl,
          date: new Date(e.date),
        })),
      },
    }
  }

  const updated = await prisma.record.update({
    where: { id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.type && { type: data.type }),
      ...(data.status && { status: data.status }),
      ...(data.urgency && { urgency: data.urgency }),
      ...(data.images && { images: data.images }),
      ...(data.location !== undefined && { location: data.location }),
      ...(data.tags && { tags: data.tags }),
      ...(data.villageId !== undefined && { villageId: data.villageId }),
      ...(data.assignedToId !== undefined && { assignedToId: data.assignedToId }),
      ...(data.deviceUpdatedAt && { deviceUpdatedAt: new Date(data.deviceUpdatedAt) }),
      updatedById: userId,
      lastSyncedAt: new Date(),
      ...communityDetailOp,
      ...expensesOp,
    },
    include: { communityDetail: true, expenses: true, updates: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.adminId ?? session.user.id
  const { id } = await params

  const existing = await getOwnerAndRecord(id, userId)
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.record.delete({ where: { id } })

  return NextResponse.json({ ok: true })
}

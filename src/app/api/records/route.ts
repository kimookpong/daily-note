import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const CreateRecordSchema = z.object({
  localId: z.string().min(1),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["ISSUE", "ACTIVITY", "FIELD_WORK", "COMMUNITY", "OTHER"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED"]).default("PENDING"),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
  images: z.array(z.string()).default([]),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
  villageId: z.string().optional(),
  assignedToId: z.string().optional(),
  deviceUpdatedAt: z.string().datetime(),
  communityDetail: z
    .object({
      eventType: z.enum(["FUNERAL", "WEDDING", "RELIGIOUS", "VISIT", "OTHER"]),
      host: z.string().optional(),
      conversation: z.string().optional(),
      needs: z.string().optional(),
    })
    .optional(),
  expenses: z
    .array(
      z.object({
        description: z.string(),
        amount: z.number(),
        receiptUrl: z.string().optional(),
        date: z.string(),
      })
    )
    .default([]),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.adminId ?? session.user.id

  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type")
  const status = searchParams.get("status")
  const urgency = searchParams.get("urgency")
  const search = searchParams.get("search")

  const records = await prisma.record.findMany({
    where: {
      createdById: userId,
      ...(type && { type: type as never }),
      ...(status && { status: status as never }),
      ...(urgency && { urgency: urgency as never }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { tags: { has: search } },
        ],
      }),
    },
    include: {
      communityDetail: true,
      expenses: true,
      updates: true,
    },
    orderBy: { deviceUpdatedAt: "desc" },
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.adminId ?? session.user.id

  const body = await req.json()
  const parsed = CreateRecordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const record = await prisma.record.create({
    data: {
      localId: data.localId,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      urgency: data.urgency,
      images: data.images,
      location: data.location,
      tags: data.tags,
      villageId: data.villageId,
      createdById: userId,
      assignedToId: data.assignedToId,
      updatedById: userId,
      deviceUpdatedAt: new Date(data.deviceUpdatedAt),
      lastSyncedAt: new Date(),
      ...(data.communityDetail && {
        communityDetail: { create: data.communityDetail },
      }),
      ...(data.expenses.length > 0 && {
        expenses: {
          create: data.expenses.map((e) => ({
            description: e.description,
            amount: e.amount,
            receiptUrl: e.receiptUrl,
            date: new Date(e.date),
          })),
        },
      }),
    },
    include: { communityDetail: true, expenses: true, updates: true },
  })

  return NextResponse.json(record, { status: 201 })
}

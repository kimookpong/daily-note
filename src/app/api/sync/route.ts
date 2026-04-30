import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const SyncPayloadSchema = z.object({
  localId: z.string().min(1),
  serverId: z.string().optional(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(["ISSUE", "ACTIVITY", "FIELD_WORK", "COMMUNITY", "OTHER"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED"]),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
  images: z.array(z.string()).default([]),
  location: z.string().optional(),
  tags: z.array(z.string()).default([]),
  villageId: z.string().optional(),
  assignedToId: z.string().optional(),
  updatedById: z.string().optional(),
  deviceUpdatedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
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
    .default([]),
  updates: z
    .array(
      z.object({
        id: z.string().optional(),
        content: z.string(),
        status: z.string(),
        createdBy: z.string(),
        createdAt: z.string(),
      })
    )
    .default([]),
})

/**
 * POST /api/sync
 * Create-or-update with Last Write Wins using deviceUpdatedAt.
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.adminId ?? session.user.id

  const body = await req.json()
  const parsed = SyncPayloadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data
  const incomingDeviceUpdatedAt = new Date(data.deviceUpdatedAt)

  // Check if record already exists on the server (by localId or serverId)
  const existing = await prisma.record.findFirst({
    where: {
      OR: [
        { localId: data.localId },
        ...(data.serverId ? [{ id: data.serverId }] : []),
      ],
      createdById: userId,
    },
    include: { communityDetail: true },
  })

  if (!existing) {
    // Create new record
    const created = await prisma.record.create({
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
        deviceUpdatedAt: incomingDeviceUpdatedAt,
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
        ...(data.updates.length > 0 && {
          updates: {
            create: data.updates.map((u) => ({
              content: u.content,
              status: u.status as never,
              createdById: userId,
              createdBy: u.createdBy,
              createdAt: new Date(u.createdAt),
            })),
          },
        }),
      },
      include: { communityDetail: true, expenses: true, updates: true },
    })

    return NextResponse.json(created, { status: 201 })
  }

  // LWW: only update if incoming deviceUpdatedAt is newer
  if (incomingDeviceUpdatedAt <= existing.deviceUpdatedAt) {
    return NextResponse.json(existing)
  }

  // Update existing record
  const updated = await prisma.record.update({
    where: { id: existing.id },
    data: {
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      urgency: data.urgency,
      images: data.images,
      location: data.location,
      tags: data.tags,
      villageId: data.villageId,
      assignedToId: data.assignedToId,
      updatedById: userId,
      deviceUpdatedAt: incomingDeviceUpdatedAt,
      lastSyncedAt: new Date(),
      // Community detail upsert
      communityDetail: data.communityDetail
        ? {
            upsert: {
              create: data.communityDetail,
              update: data.communityDetail,
            },
          }
        : data.communityDetail === null && existing.communityDetail
        ? { delete: true }
        : undefined,
      // Expenses: delete all and recreate
      expenses: {
        deleteMany: {},
        create: data.expenses.map((e) => ({
          description: e.description,
          amount: e.amount,
          receiptUrl: e.receiptUrl,
          date: new Date(e.date),
        })),
      },
    },
    include: { communityDetail: true, expenses: true, updates: true },
  })

  return NextResponse.json(updated)
}

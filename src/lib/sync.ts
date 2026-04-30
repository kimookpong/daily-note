"use client"

import { getDB, type LocalRecord } from "@/lib/local-db"

let isSyncing = false

/**
 * Push all pending local records to the server.
 * Uses Last Write Wins based on deviceUpdatedAt.
 */
export async function syncPendingRecords(): Promise<{ synced: number; errors: number }> {
  if (typeof window === "undefined") return { synced: 0, errors: 0 }
  if (!navigator.onLine) return { synced: 0, errors: 0 }
  if (isSyncing) return { synced: 0, errors: 0 }

  isSyncing = true
  const db = getDB()
  let synced = 0
  let errors = 0

  try {
    const pending = await db.records
      .where("syncStatus")
      .anyOf(["pending", "error"])
      .toArray()

    for (const record of pending) {
      try {
        if (record.deleted && record.serverId) {
          // Delete on server
          const res = await fetch(`/api/records/${record.serverId}`, {
            method: "DELETE",
          })
          if (res.ok) {
            await db.records.delete(record.localId)
            synced++
          } else {
            await db.records.update(record.localId, { syncStatus: "error" })
            errors++
          }
          continue
        }

        if (record.deleted && !record.serverId) {
          // Never synced — just remove locally
          await db.records.delete(record.localId)
          synced++
          continue
        }

        const payload = recordToPayload(record)
        const res = await fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })

        if (res.ok) {
          const data = await res.json()
          await db.records.update(record.localId, {
            serverId: data.id,
            syncStatus: "synced",
            lastSyncedAt: Date.now(),
          })
          synced++
        } else {
          await db.records.update(record.localId, { syncStatus: "error" })
          errors++
        }
      } catch {
        await db.records.update(record.localId, { syncStatus: "error" })
        errors++
      }
    }
  } finally {
    isSyncing = false
  }

  return { synced, errors }
}

/**
 * Fetch all records from the server and merge into IndexedDB.
 * Server record wins if its deviceUpdatedAt is newer.
 */
export async function fetchAndMergeFromServer(): Promise<void> {
  if (typeof window === "undefined") return
  if (!navigator.onLine) return

  try {
    const res = await fetch("/api/records")
    if (!res.ok) return

    const serverRecords: ReturnType<typeof payloadToRecord>[] = await res.json()
    const db = getDB()

    for (const serverRecord of serverRecords) {
      const local = await db.records
        .where("serverId")
        .equals(serverRecord.serverId ?? "")
        .first()

      if (!local) {
        // New from server — insert
        const localRecord = payloadToRecord(serverRecord)
        await db.records.put(localRecord)
      } else {
        const serverTs = new Date(serverRecord.deviceUpdatedAt).getTime()
        const localTs = local.deviceUpdatedAt

        if (serverTs > localTs && local.syncStatus === "synced") {
          // Server is newer — overwrite local (only if local has no pending changes)
          const merged = payloadToRecord(serverRecord)
          merged.localId = local.localId
          await db.records.put(merged)
        }
      }
    }
  } catch (err) {
    console.error("[sync] fetchAndMergeFromServer failed:", err)
  }
}

// ─── Serialization helpers ─────────────────────────────────────────────────

function recordToPayload(record: LocalRecord) {
  return {
    localId: record.localId,
    serverId: record.serverId,
    title: record.title,
    description: record.description,
    type: record.type,
    status: record.status,
    urgency: record.urgency,
    images: record.images,
    location: record.location,
    tags: record.tags,
    villageId: record.villageId,
    communityDetail: record.communityDetail,
    expenses: record.expenses,
    updates: record.updates,
    createdById: record.createdById,
    assignedToId: record.assignedToId,
    updatedById: record.updatedById,
    deviceUpdatedAt: new Date(record.deviceUpdatedAt).toISOString(),
    createdAt: new Date(record.createdAt).toISOString(),
    updatedAt: new Date(record.updatedAt).toISOString(),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function payloadToRecord(payload: any): LocalRecord {
  return {
    localId: payload.localId,
    serverId: payload.id ?? payload.serverId,
    syncStatus: "synced",
    lastSyncedAt: Date.now(),
    deviceUpdatedAt: new Date(payload.deviceUpdatedAt).getTime(),
    deleted: false,

    title: payload.title,
    description: payload.description,
    type: payload.type,
    status: payload.status,
    urgency: payload.urgency,
    images: payload.images ?? [],
    location: payload.location,
    tags: payload.tags ?? [],
    villageId: payload.villageId,

    communityDetail: payload.communityDetail,
    expenses: (payload.expenses ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => ({
        id: e.id,
        description: e.description,
        amount: Number(e.amount),
        receiptUrl: e.receiptUrl,
        date: e.date,
      })
    ),
    updates: payload.updates ?? [],

    createdById: payload.createdById,
    assignedToId: payload.assignedToId,
    updatedById: payload.updatedById,

    createdAt: new Date(payload.createdAt).getTime(),
    updatedAt: new Date(payload.updatedAt).getTime(),
  }
}

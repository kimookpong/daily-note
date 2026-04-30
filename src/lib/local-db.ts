import Dexie, { type Table } from "dexie"

export type SyncStatus = "pending" | "synced" | "error"

export interface LocalExpense {
  id: string
  description: string
  amount: number
  receiptUrl?: string
  date: string // ISO date string
}

export interface LocalCommunityDetail {
  eventType: "FUNERAL" | "WEDDING" | "RELIGIOUS" | "VISIT" | "OTHER"
  host?: string
  conversation?: string
  needs?: string
}

export interface LocalRecordUpdate {
  id: string
  content: string
  status: string
  createdBy: string
  createdAt: string // ISO date string
}

export interface LocalRecord {
  // Sync metadata
  localId: string          // primary key — generated on client
  serverId?: string        // set after first successful sync
  syncStatus: SyncStatus
  lastSyncedAt?: number    // timestamp ms
  deviceUpdatedAt: number  // timestamp ms — used for LWW conflict resolution
  deleted?: boolean        // soft-delete flag for sync

  // Core fields
  title: string
  description?: string
  type: "ISSUE" | "ACTIVITY" | "FIELD_WORK" | "COMMUNITY" | "OTHER"
  status: "PENDING" | "IN_PROGRESS" | "RESOLVED" | "CANCELLED"
  urgency: "LOW" | "NORMAL" | "HIGH" | "CRITICAL"
  images: string[]
  location?: string
  tags: string[]
  villageId?: string

  // Relations (embedded for offline)
  communityDetail?: LocalCommunityDetail
  expenses: LocalExpense[]
  updates: LocalRecordUpdate[]

  // Audit
  createdById: string
  assignedToId?: string
  updatedById?: string

  // Timestamps
  createdAt: number // timestamp ms
  updatedAt: number // timestamp ms
}

class DailyNoteDB extends Dexie {
  records!: Table<LocalRecord, string>

  constructor() {
    super("daily-note-db")

    this.version(1).stores({
      // localId is primary key; index syncStatus, type, status, urgency, createdById, tags
      records:
        "localId, syncStatus, type, status, urgency, createdById, deviceUpdatedAt, createdAt, *tags",
    })

    // v2 — add serverId index so sync queries can look up records by server id
    this.version(2).stores({
      records:
        "localId, serverId, syncStatus, type, status, urgency, createdById, deviceUpdatedAt, createdAt, *tags",
    })
  }
}

// Guard against SSR — Dexie requires window/indexedDB
let db: DailyNoteDB | null = null

export function getDB(): DailyNoteDB {
  if (typeof window === "undefined") {
    throw new Error("getDB() called on the server — use it only in client components")
  }
  if (!db) {
    db = new DailyNoteDB()
  }
  return db
}

// Convenience export for use in client hooks
export { DailyNoteDB }

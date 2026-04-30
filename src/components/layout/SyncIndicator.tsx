"use client"

import { useEffect, useState } from "react"
import { RefreshCw, CheckCircle2, WifiOff } from "lucide-react"
import { useLiveQuery } from "dexie-react-hooks"
import { getDB } from "@/lib/local-db"
import { syncPendingRecords } from "@/lib/sync"
import { cn } from "@/lib/utils"

export function SyncIndicator() {
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  const pendingCount = useLiveQuery(
    () => getDB().records.where("syncStatus").anyOf(["pending", "error"]).count(),
    [],
    0
  )

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener("online", on)
    window.addEventListener("offline", off)
    return () => {
      window.removeEventListener("online", on)
      window.removeEventListener("offline", off)
    }
  }, [])

  const handleSync = async () => {
    if (!isOnline || isSyncing) return
    setIsSyncing(true)
    await syncPendingRecords()
    setIsSyncing(false)
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-red-50 text-red-500 text-xs font-medium">
        <WifiOff className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">ออฟไลน์</span>
      </div>
    )
  }

  if (pendingCount && pendingCount > 0) {
    return (
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-1 px-2 py-1 rounded-xl bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors"
      >
        <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
        <span>{pendingCount}</span>
      </button>
    )
  }

  return (
    <div className="w-7 h-7 rounded-xl bg-green-50 flex items-center justify-center">
      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
    </div>
  )
}

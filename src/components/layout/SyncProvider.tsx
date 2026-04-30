"use client"

import { useEffect, useCallback } from "react"
import { syncPendingRecords, fetchAndMergeFromServer } from "@/lib/sync"

interface SyncProviderProps {
  children: React.ReactNode
}

export function SyncProvider({ children }: SyncProviderProps) {
  const runSync = useCallback(async () => {
    try {
      await syncPendingRecords()
      await fetchAndMergeFromServer()
    } catch (err) {
      console.error("[SyncProvider] Sync error:", err)
    }
  }, [])

  useEffect(() => {
    // Sync on mount (if online)
    if (navigator.onLine) {
      runSync()
    }

    // Sync when coming back online
    const handleOnline = () => {
      console.log("[SyncProvider] Back online — syncing...")
      runSync()
    }

    window.addEventListener("online", handleOnline)
    return () => window.removeEventListener("online", handleOnline)
  }, [runSync])

  // Periodic sync every 2 minutes when tab is visible and online
  useEffect(() => {
    const interval = setInterval(() => {
      if (navigator.onLine && document.visibilityState === "visible") {
        runSync()
      }
    }, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [runSync])

  return <>{children}</>
}

"use client";

import { useLiveQuery } from "dexie-react-hooks";
import { useState, useMemo } from "react";
import { getDB } from "@/lib/local-db";
import { RecordCard } from "@/components/records/RecordCard";
import {
  RECORD_TYPE_LABELS,
  RECORD_STATUS_LABELS,
  URGENCY_LABELS,
} from "@/types";
import type { RecordType, RecordStatus, Urgency } from "@/types";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function FilterChip({
  label,
  active,
  onClick,
  activeColor = "bg-[#1B3B6F] text-white border-[#1B3B6F]",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  activeColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-lg text-sm font-medium border transition-all",
        active
          ? activeColor
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800",
      )}
    >
      {label}
    </button>
  );
}

type FilterState = {
  search: string;
  type: RecordType | "";
  status: RecordStatus | "";
  urgency: Urgency | "";
};

export default function RecordsPage() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    type: "",
    status: "",
    urgency: "",
  });
  const [showFilters, setShowFilters] = useState(false);

  // Live query from IndexedDB — returns all non-deleted records
  const allRecords = useLiveQuery(async () => {
    const db = getDB();
    return db.records
      .orderBy("deviceUpdatedAt")
      .reverse()
      .filter((r) => !r.deleted)
      .toArray();
  }, []);

  // Client-side filtering
  const filteredRecords = useMemo(() => {
    if (!allRecords) return [];

    return allRecords.filter((r) => {
      if (filters.type && r.type !== filters.type) return false;
      if (filters.status && r.status !== filters.status) return false;
      if (filters.urgency && r.urgency !== filters.urgency) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const inTitle = r.title.toLowerCase().includes(q);
        const inDesc = r.description?.toLowerCase().includes(q) ?? false;
        const inTags = r.tags.some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inTags) return false;
      }
      return true;
    });
  }, [allRecords, filters]);

  const hasActiveFilters =
    filters.type !== "" || filters.status !== "" || filters.urgency !== "";

  function clearFilters() {
    setFilters({ search: "", type: "", status: "", urgency: "" });
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900">บันทึก</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {allRecords ? `${allRecords.length} รายการ` : "กำลังโหลด..."}
          </p>
        </div>
        <Link
          href="/records/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-4 py-2.5 text-md transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">เพิ่มบันทึก</span>
        </Link>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            placeholder="ค้นหา..."
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-md font-medium transition-colors",
            showFilters || hasActiveFilters
              ? "bg-blue-50 border-blue-300 text-blue-700"
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">กรอง</span>
          {hasActiveFilters && (
            <span className="ml-0.5 w-4 h-4 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center">
              !
            </span>
          )}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white border border-slate-100 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-md font-medium text-slate-700">ตัวกรอง</span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
              >
                <X className="w-3 h-3" />
                ล้างทั้งหมด
              </button>
            )}
          </div>

          <div className="space-y-3">
            {/* Type filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                ประเภท
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="ทั้งหมด"
                  active={filters.type === ""}
                  onClick={() => setFilters((f) => ({ ...f, type: "" }))}
                />
                {(
                  Object.entries(RECORD_TYPE_LABELS) as [RecordType, string][]
                ).map(([k, v]) => (
                  <FilterChip
                    key={k}
                    label={v}
                    active={filters.type === k}
                    onClick={() => setFilters((f) => ({ ...f, type: k }))}
                  />
                ))}
              </div>
            </div>

            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                สถานะ
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="ทั้งหมด"
                  active={filters.status === ""}
                  onClick={() => setFilters((f) => ({ ...f, status: "" }))}
                />
                {(
                  Object.entries(RECORD_STATUS_LABELS) as [
                    RecordStatus,
                    string,
                  ][]
                ).map(([k, v]) => (
                  <FilterChip
                    key={k}
                    label={v}
                    active={filters.status === k}
                    onClick={() => setFilters((f) => ({ ...f, status: k }))}
                    activeColor={
                      k === "PENDING"
                        ? "bg-yellow-500 text-white border-yellow-500"
                        : k === "IN_PROGRESS"
                          ? "bg-blue-600 text-white border-blue-600"
                          : k === "RESOLVED"
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-slate-500 text-white border-slate-500"
                    }
                  />
                ))}
              </div>
            </div>

            {/* Urgency filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">
                ความเร่งด่วน
              </label>
              <div className="flex flex-wrap gap-2">
                <FilterChip
                  label="ทั้งหมด"
                  active={filters.urgency === ""}
                  onClick={() => setFilters((f) => ({ ...f, urgency: "" }))}
                />
                {(Object.entries(URGENCY_LABELS) as [Urgency, string][]).map(
                  ([k, v]) => (
                    <FilterChip
                      key={k}
                      label={v}
                      active={filters.urgency === k}
                      onClick={() => setFilters((f) => ({ ...f, urgency: k }))}
                      activeColor={
                        k === "LOW"
                          ? "bg-slate-500 text-white border-slate-500"
                          : k === "NORMAL"
                            ? "bg-blue-600 text-white border-blue-600"
                            : k === "HIGH"
                              ? "bg-orange-500 text-white border-orange-500"
                              : "bg-red-600 text-white border-red-600"
                      }
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Records list */}
      {allRecords === undefined ? (
        // Loading state
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-4 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 font-medium">ไม่พบรายการ</p>
          <p className="text-slate-400 text-md mt-1">
            {hasActiveFilters || filters.search
              ? "ลองเปลี่ยนคำค้นหาหรือตัวกรอง"
              : "กดปุ่ม เพิ่มบันทึก เพื่อเริ่มต้น"}
          </p>
          {(hasActiveFilters || filters.search) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-blue-600 text-md hover:underline"
            >
              ล้างตัวกรอง
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => (
            <RecordCard key={record.localId} record={record} />
          ))}
        </div>
      )}
    </div>
  );
}

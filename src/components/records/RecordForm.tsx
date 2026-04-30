"use client"

import { useRouter } from "next/navigation"
import { useForm, useFieldArray, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useState } from "react"
import { getDB } from "@/lib/local-db"
import type { LocalRecord, LocalExpense } from "@/lib/local-db"
import { generateLocalId } from "@/lib/utils"
import {
  RECORD_TYPE_LABELS,
  RECORD_STATUS_LABELS,
  URGENCY_LABELS,
  COMMUNITY_EVENT_TYPE_LABELS,
} from "@/types"
import type { RecordType, RecordStatus, Urgency, CommunityEventType } from "@/types"
import { Loader2, Plus, Trash2, Save, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Zod schema ─────────────────────────────────────────────────────────────

const ExpenseSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "กรุณาระบุรายละเอียดค่าใช้จ่าย"),
  amount: z.coerce.number().min(0, "จำนวนเงินต้องไม่ติดลบ"),
  receiptUrl: z.string().optional(),
  date: z.string().min(1, "กรุณาระบุวันที่"),
})

const CommunityDetailSchema = z.object({
  eventType: z.enum(["FUNERAL", "WEDDING", "RELIGIOUS", "VISIT", "OTHER"]),
  host: z.string().optional(),
  conversation: z.string().optional(),
  needs: z.string().optional(),
})

const RecordSchema = z.object({
  title: z.string().min(1, "กรุณาระบุหัวข้อ").max(255),
  description: z.string().optional(),
  type: z.enum(["ISSUE", "ACTIVITY", "FIELD_WORK", "COMMUNITY", "OTHER"]),
  status: z.enum(["PENDING", "IN_PROGRESS", "RESOLVED", "CANCELLED"]),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]),
  location: z.string().optional(),
  tags: z.string().optional(), // comma-separated
  villageId: z.string().optional(),
  communityDetail: CommunityDetailSchema.optional(),
  expenses: z.array(ExpenseSchema).default([]),
})

type FormValues = z.infer<typeof RecordSchema>

// ─── Helper components ───────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-red-500 mt-1">{message}</p>
}

function InputClass(hasError?: boolean) {
  return cn(
    "w-full px-4 py-3 bg-[#F0F5FF] border rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/30 focus:border-[#1B3B6F] transition-colors",
    hasError ? "border-red-400" : "border-slate-200"
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
      <h2 className="font-bold text-slate-900 text-base">{title}</h2>
      {children}
    </div>
  )
}

function ButtonSelect<T extends string>({
  options,
  value,
  onChange,
  colorMap,
}: {
  options: [T, string][]
  value: T
  onChange: (v: T) => void
  colorMap?: Partial<Record<T, string>>
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([key, label]) => {
        const selected = value === key
        const activeColor = colorMap?.[key] ?? "bg-[#1B3B6F] text-white border-[#1B3B6F]"
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium border transition-all",
              selected
                ? activeColor
                : "bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800"
            )}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

interface RecordFormProps {
  userId: string
  existingRecord?: LocalRecord
}

export function RecordForm({ userId, existingRecord }: RecordFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const isEdit = !!existingRecord

  // Convert tags array → comma string for the form field
  const defaultTags = existingRecord?.tags.join(", ") ?? ""

  // Convert expenses from LocalExpense to form shape
  const defaultExpenses: FormValues["expenses"] = (existingRecord?.expenses ?? []).map(
    (e: LocalExpense) => ({
      id: e.id,
      description: e.description,
      amount: e.amount,
      receiptUrl: e.receiptUrl ?? "",
      date: e.date,
    })
  )

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(RecordSchema),
    defaultValues: {
      title: existingRecord?.title ?? "",
      description: existingRecord?.description ?? "",
      type: existingRecord?.type ?? "ISSUE",
      status: existingRecord?.status ?? "PENDING",
      urgency: existingRecord?.urgency ?? "NORMAL",
      location: existingRecord?.location ?? "",
      tags: defaultTags,
      villageId: existingRecord?.villageId ?? "",
      communityDetail: existingRecord?.communityDetail ?? {
        eventType: "OTHER",
        host: "",
        conversation: "",
        needs: "",
      },
      expenses: defaultExpenses,
    },
  })

  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({ control, name: "expenses" })

  const watchedType = watch("type")
  const isCommunity = watchedType === "COMMUNITY"

  // ─── Submit ───────────────────────────────────────────────────────────────

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setSaveError(null)

    try {
      const db = getDB()
      const now = Date.now()

      const tags = values.tags
        ? values.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : []

      const expenses: LocalExpense[] = values.expenses.map((e, i) => ({
        id: e.id ?? `exp_${now}_${i}`,
        description: e.description,
        amount: e.amount,
        receiptUrl: e.receiptUrl || undefined,
        date: e.date,
      }))

      if (isEdit && existingRecord) {
        // Update
        const updated: LocalRecord = {
          ...existingRecord,
          title: values.title,
          description: values.description || undefined,
          type: values.type,
          status: values.status,
          urgency: values.urgency,
          location: values.location || undefined,
          tags,
          villageId: values.villageId || undefined,
          communityDetail: isCommunity ? values.communityDetail : undefined,
          expenses,
          updatedById: userId,
          syncStatus: "pending",
          deviceUpdatedAt: now,
          updatedAt: now,
        }
        await db.records.put(updated)
      } else {
        // Create
        const newRecord: LocalRecord = {
          localId: generateLocalId(),
          syncStatus: "pending",
          deviceUpdatedAt: now,

          title: values.title,
          description: values.description || undefined,
          type: values.type,
          status: values.status,
          urgency: values.urgency,
          images: [],
          location: values.location || undefined,
          tags,
          villageId: values.villageId || undefined,
          communityDetail: isCommunity ? values.communityDetail : undefined,
          expenses,
          updates: [],

          createdById: userId,
          updatedById: userId,

          createdAt: now,
          updatedAt: now,
        }
        await db.records.add(newRecord)
      }

      router.push("/records")
    } catch (err) {
      console.error("Failed to save record:", err)
      setSaveError("บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setSaving(false)
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!existingRecord) return
    const confirmed = window.confirm("ต้องการลบบันทึกนี้ใช่หรือไม่?")
    if (!confirmed) return

    setDeleting(true)
    try {
      const db = getDB()

      if (existingRecord.serverId && navigator.onLine) {
        // Try to delete from server
        try {
          await fetch(`/api/records/${existingRecord.serverId}`, { method: "DELETE" })
        } catch {
          // Continue even if server delete fails — will be handled by soft-delete sync
        }
        // Remove from IndexedDB
        await db.records.delete(existingRecord.localId)
      } else if (existingRecord.serverId) {
        // Offline: soft-delete — mark for deletion on next sync
        await db.records.update(existingRecord.localId, {
          deleted: true,
          syncStatus: "pending",
          deviceUpdatedAt: Date.now(),
        })
      } else {
        // Never synced — just remove
        await db.records.delete(existingRecord.localId)
      }

      router.push("/records")
    } catch (err) {
      console.error("Failed to delete record:", err)
    } finally {
      setDeleting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pb-24 md:pb-6">
      {/* Error banner */}
      {saveError && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* Basic info */}
      <SectionCard title="ข้อมูลพื้นฐาน">
        <div>
          <Label required>หัวข้อ</Label>
          <input
            type="text"
            placeholder="ระบุหัวข้อบันทึก..."
            {...register("title")}
            className={InputClass(!!errors.title)}
          />
          <FieldError message={errors.title?.message} />
        </div>

        <div>
          <Label>รายละเอียด</Label>
          <textarea
            rows={3}
            placeholder="อธิบายรายละเอียดเพิ่มเติม..."
            {...register("description")}
            className={cn(InputClass(!!errors.description), "resize-y")}
          />
          <FieldError message={errors.description?.message} />
        </div>

        {/* Type */}
        <div>
          <Label required>ประเภท</Label>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <ButtonSelect
                options={Object.entries(RECORD_TYPE_LABELS) as [RecordType, string][]}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <FieldError message={errors.type?.message} />
        </div>

        {/* Status */}
        <div>
          <Label required>สถานะ</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <ButtonSelect
                options={Object.entries(RECORD_STATUS_LABELS) as [RecordStatus, string][]}
                value={field.value}
                onChange={field.onChange}
                colorMap={{
                  PENDING: "bg-yellow-500 text-white border-yellow-500",
                  IN_PROGRESS: "bg-blue-600 text-white border-blue-600",
                  RESOLVED: "bg-green-600 text-white border-green-600",
                  CANCELLED: "bg-slate-500 text-white border-slate-500",
                }}
              />
            )}
          />
          <FieldError message={errors.status?.message} />
        </div>

        {/* Urgency */}
        <div>
          <Label required>ความเร่งด่วน</Label>
          <Controller
            control={control}
            name="urgency"
            render={({ field }) => (
              <ButtonSelect
                options={Object.entries(URGENCY_LABELS) as [Urgency, string][]}
                value={field.value}
                onChange={field.onChange}
                colorMap={{
                  LOW: "bg-slate-500 text-white border-slate-500",
                  NORMAL: "bg-blue-600 text-white border-blue-600",
                  HIGH: "bg-orange-500 text-white border-orange-500",
                  CRITICAL: "bg-red-600 text-white border-red-600",
                }}
              />
            )}
          />
          <FieldError message={errors.urgency?.message} />
        </div>
      </SectionCard>

      {/* Location & Tags */}
      <SectionCard title="สถานที่และแท็ก">
        <div>
          <Label>สถานที่</Label>
          <input
            type="text"
            placeholder="ระบุสถานที่หรือที่อยู่..."
            {...register("location")}
            className={InputClass()}
          />
        </div>

        <div>
          <Label>แท็ก</Label>
          <input
            type="text"
            placeholder="คั่นด้วยเครื่องหมาย , เช่น น้ำประปา, ถนน, ไฟฟ้า"
            {...register("tags")}
            className={InputClass()}
          />
          <p className="text-xs text-slate-400 mt-1">คั่นแต่ละแท็กด้วยเครื่องหมายจุลภาค (,)</p>
        </div>
      </SectionCard>

      {/* Community detail — only shown when type = COMMUNITY */}
      {isCommunity && (
        <SectionCard title="รายละเอียดงานชุมชน">
          <div>
            <Label required>ประเภทงาน</Label>
            <Controller
              control={control}
              name="communityDetail.eventType"
              render={({ field }) => (
                <ButtonSelect
                  options={
                    Object.entries(COMMUNITY_EVENT_TYPE_LABELS) as [CommunityEventType, string][]
                  }
                  value={field.value ?? "OTHER"}
                  onChange={field.onChange}
                />
              )}
            />
            <FieldError message={errors.communityDetail?.eventType?.message} />
          </div>

          <div>
            <Label>เจ้าภาพ / ผู้รับผิดชอบ</Label>
            <input
              type="text"
              placeholder="ชื่อเจ้าภาพหรือผู้รับผิดชอบ..."
              {...register("communityDetail.host")}
              className={InputClass()}
            />
          </div>

          <div>
            <Label>บันทึกการพูดคุย</Label>
            <textarea
              rows={3}
              placeholder="บันทึกการสนทนาหรือข้อตกลงที่ได้คุยกัน..."
              {...register("communityDetail.conversation")}
              className={cn(InputClass(), "resize-y")}
            />
          </div>

          <div>
            <Label>ความต้องการ / ข้อเสนอแนะ</Label>
            <textarea
              rows={3}
              placeholder="ความต้องการของชุมชนหรือข้อเสนอแนะ..."
              {...register("communityDetail.needs")}
              className={cn(InputClass(), "resize-y")}
            />
          </div>
        </SectionCard>
      )}

      {/* Expenses */}
      <SectionCard title="ค่าใช้จ่าย">
        {expenseFields.length === 0 && (
          <p className="text-slate-400 text-sm">ยังไม่มีรายการค่าใช้จ่าย</p>
        )}

        <div className="space-y-4">
          {expenseFields.map((field, index) => (
            <div
              key={field.id}
              className="bg-[#F0F5FF] rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  รายการที่ {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeExpense(index)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  ลบ
                </button>
              </div>

              <div>
                <Label required>รายละเอียด</Label>
                <input
                  type="text"
                  placeholder="รายละเอียดค่าใช้จ่าย..."
                  {...register(`expenses.${index}.description`)}
                  className={InputClass(!!errors.expenses?.[index]?.description)}
                />
                <FieldError message={errors.expenses?.[index]?.description?.message} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label required>จำนวนเงิน (บาท)</Label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    inputMode="decimal"
                    {...register(`expenses.${index}.amount`)}
                    className={InputClass(!!errors.expenses?.[index]?.amount)}
                  />
                  <FieldError message={errors.expenses?.[index]?.amount?.message} />
                </div>

                <div>
                  <Label required>วันที่</Label>
                  <input
                    type="date"
                    {...register(`expenses.${index}.date`)}
                    className={InputClass(!!errors.expenses?.[index]?.date)}
                  />
                  <FieldError message={errors.expenses?.[index]?.date?.message} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            appendExpense({
              description: "",
              amount: 0,
              receiptUrl: "",
              date: new Date().toISOString().split("T")[0],
            })
          }
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#1B3B6F]/30 text-[#1B3B6F] text-sm font-semibold hover:bg-[#EEF3FF] transition-colors"
        >
          <Plus className="w-5 h-5" />
          เพิ่มรายการค่าใช้จ่าย
        </button>
      </SectionCard>

      {/* Actions */}
      <div className="space-y-3 pt-2">
        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#1B3B6F] hover:bg-[#163260] text-white text-base font-bold transition-colors disabled:opacity-50 shadow-lg shadow-[#1B3B6F]/30"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isEdit ? "บันทึกการแก้ไข" : "บันทึก"}
        </button>

        <div className="flex gap-3">
          {/* Cancel */}
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3.5 rounded-2xl border-2 border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            ยกเลิก
          </button>

          {/* Delete — edit mode only */}
          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 border-2 border-red-200 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              ลบบันทึก
            </button>
          )}
        </div>
      </div>
    </form>
  )
}

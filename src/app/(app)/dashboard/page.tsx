import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import {
  ClipboardList,
  Clock,
  TrendingUp,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Activity,
} from "lucide-react";
import { RECORD_TYPE_LABELS, RECORD_STATUS_LABELS } from "@/types";
import type { RecordType, RecordStatus } from "@/types";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "แดชบอร์ด — Daily Note" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = session.user.adminId ?? session.user.id;

  // Date range for current month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  // Parallel queries
  const [totalRecords, byStatus, byType, expenseAgg, recentRecords] =
    await Promise.all([
      // Total records for this admin
      prisma.record.count({
        where: { createdById: userId },
      }),

      // Group by status
      prisma.record.groupBy({
        by: ["status"],
        where: { createdById: userId },
        _count: { status: true },
      }),

      // Group by type
      prisma.record.groupBy({
        by: ["type"],
        where: { createdById: userId },
        _count: { type: true },
      }),

      // Monthly expense sum
      prisma.expense.aggregate({
        where: {
          record: { createdById: userId },
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),

      // Recent 5 records
      prisma.record.findMany({
        where: { createdById: userId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          localId: true,
          title: true,
          type: true,
          status: true,
          urgency: true,
          updatedAt: true,
        },
      }),
    ]);

  const pendingCount =
    byStatus.find((s) => s.status === "PENDING")?._count.status ?? 0;
  const inProgressCount =
    byStatus.find((s) => s.status === "IN_PROGRESS")?._count.status ?? 0;
  const resolvedCount =
    byStatus.find((s) => s.status === "RESOLVED")?._count.status ?? 0;

  const monthlyExpenses = Number(expenseAgg._sum.amount ?? 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-black text-slate-900">แดชบอร์ด</h1>
        <p className="text-slate-400 text-sm">{formatDate(now)}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatCard
          icon={<ClipboardList className="w-5 h-5 text-blue-600" />}
          bg="bg-blue-50"
          color="text-blue-600"
          label="บันทึกทั้งหมด"
          value={totalRecords.toLocaleString("th-TH")}
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-yellow-600" />}
          bg="bg-yellow-50"
          color="text-yellow-600"
          label="รอดำเนินการ"
          value={pendingCount.toLocaleString("th-TH")}
        />
        <StatCard
          icon={<Activity className="w-5 h-5 text-sky-600" />}
          bg="bg-sky-50"
          color="text-sky-600"
          label="กำลังดำเนินการ"
          value={inProgressCount.toLocaleString("th-TH")}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-green-600" />}
          bg="bg-green-50"
          color="text-green-600"
          label="เสร็จสิ้น"
          value={resolvedCount.toLocaleString("th-TH")}
        />
      </div>

      {/* Monthly expenses */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
          <Banknote className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm text-slate-500">ค่าใช้จ่ายเดือนนี้</p>
          <p className="text-3xl font-black text-slate-900 leading-tight">
            ฿
            {monthlyExpenses.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Two-column section */}
      <div className="grid md:grid-cols-2 gap-2">
        {/* By type */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800 text-md">
              จำแนกตามประเภท
            </h2>
          </div>
          <div className="space-y-2">
            {byType.length === 0 && (
              <p className="text-slate-400 text-md">ยังไม่มีข้อมูล</p>
            )}
            {byType.map((row) => (
              <div key={row.type} className="flex items-center justify-between">
                <span className="text-md text-slate-600">
                  {RECORD_TYPE_LABELS[row.type as RecordType]}
                </span>
                <span className="text-base font-bold text-slate-900">
                  {row._count.type.toLocaleString("th-TH")}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* By status */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-800 text-md">
              จำแนกตามสถานะ
            </h2>
          </div>
          <div className="space-y-2">
            {byStatus.length === 0 && (
              <p className="text-slate-400 text-md">ยังไม่มีข้อมูล</p>
            )}
            {byStatus.map((row) => (
              <div
                key={row.status}
                className="flex items-center justify-between"
              >
                <span className="text-md text-slate-600">
                  {RECORD_STATUS_LABELS[row.status as RecordStatus]}
                </span>
                <span className="text-base font-bold text-slate-900">
                  {row._count.status.toLocaleString("th-TH")}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent records */}
      <div className="bg-white rounded-xl border border-slate-100 p-4">
        <h2 className="font-semibold text-slate-800 text-md mb-3">
          บันทึกล่าสุด
        </h2>
        {recentRecords.length === 0 && (
          <p className="text-slate-400 text-md">ยังไม่มีบันทึก</p>
        )}
        <div className="space-y-1">
          {recentRecords.map((r) => (
            <a
              key={r.id}
              href={`/records/${r.localId}`}
              className="flex items-center justify-between gap-3 hover:bg-slate-50 rounded-lg px-2 py-2 -mx-2 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-md font-semibold text-slate-900 truncate">
                  {r.title}
                </p>
                <p className="text-sm text-slate-400">
                  {RECORD_TYPE_LABELS[r.type as RecordType]} ·{" "}
                  {formatDate(r.updatedAt)}
                </p>
              </div>
              <span
                className={`flex-shrink-0 text-sm font-medium px-2 py-0.5 rounded-full ${
                  r.status === "PENDING"
                    ? "bg-yellow-100 text-yellow-800"
                    : r.status === "IN_PROGRESS"
                      ? "bg-blue-100 text-blue-800"
                      : r.status === "RESOLVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600"
                }`}
              >
                {RECORD_STATUS_LABELS[r.status as RecordStatus]}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  bg,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  color: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 px-3 py-3 flex items-center justify-between gap-2">
      <div className="flex flex-col gap-2">
        <div
          className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}
        >
          {icon}
        </div>
        <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
      </div>
      <p className={`text-3xl font-black ${color} leading-none`}>{value}</p>
    </div>
  );
}

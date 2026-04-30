"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ClipboardList, LayoutDashboard, PlusCircle } from "lucide-react"
import { SyncIndicator } from "./SyncIndicator"
import { UserMenu } from "./UserMenu"
import { cn } from "@/lib/utils"

interface NavbarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

const navLinks = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard },
  { href: "/records", label: "บันทึก", icon: ClipboardList },
  { href: "/records/new", label: "เพิ่มใหม่", icon: PlusCircle },
]

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()

  const currentPage = navLinks.find(
    (l) => pathname === l.href || (l.href !== "/dashboard" && pathname.startsWith(l.href))
  )

  return (
    <>
      {/* ── Top header ────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-3">
          {/* Logo + page name */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1B3B6F] flex items-center justify-center flex-shrink-0">
              <ClipboardList className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">
              {currentPage?.label ?? "Daily Note"}
            </span>
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-[#1B3B6F] text-white shadow-sm"
                      : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right: sync + avatar */}
          <div className="flex items-center gap-1.5">
            <SyncIndicator />
            <UserMenu user={user} />
          </div>
        </div>
      </header>

      {/* ── Mobile bottom nav ─────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 pb-safe">
        <div className="flex max-w-2xl mx-auto">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1"
              >
                <div
                  className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center transition-all",
                    active
                      ? "bg-[#1B3B6F] text-white shadow-md shadow-[#1B3B6F]/25"
                      : "text-slate-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    active ? "text-[#1B3B6F]" : "text-slate-400"
                  )}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}

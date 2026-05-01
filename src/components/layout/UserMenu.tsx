"use client";

import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Image from "next/image";
import { LogOut, User, ChevronDown, Download } from "lucide-react";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleExport() {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `daily-note-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
    }
    setOpen(false);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg px-1.5 py-1.5 transition-colors"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? "User"}
            width={36}
            height={36}
            className="rounded-full ring-1 ring-slate-200"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
        )}
        <ChevronDown
          className={`w-3 h-3 text-slate-400 transition-transform hidden sm:block ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
          {/* User info */}
          <div className="px-4 py-3 border-b border-slate-700">
            <p className="text-md font-medium text-white truncate">
              {user.name ?? "ผู้ใช้งาน"}
            </p>
            <p className="text-sm text-slate-400 truncate mt-0.5">
              {user.email}
            </p>
          </div>

          {/* Actions */}
          <div className="py-1">
            <button
              onClick={handleExport}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-md text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
              ส่งออกข้อมูล (JSON)
            </button>

            <button
              onClick={() => {
                setOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-md text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              ออกจากระบบ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa-install-dismissed";

export function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    // Already running as installed PWA
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!visible) return null;

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  return (
    <div className="fixed bottom-[72px] md:bottom-4 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="w-full max-w-sm bg-white  shadow-xl border border-slate-100 px-4 py-3 flex items-center gap-3 pointer-events-auto">
        <Image
          src="/logo.png"
          alt="Daily Note"
          width={40}
          height={40}
          className="w-10 h-10  flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <p className="text-md font-semibold text-slate-900 leading-tight">
            Daily Note
          </p>
          <p className="text-sm text-slate-500 leading-tight">
            ติดตั้งลงบนอุปกรณ์ของคุณ
          </p>
        </div>
        <button
          onClick={handleInstall}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1B3B6F] hover:bg-[#163260] text-white text-sm font-semibold  transition-colors flex-shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          ติดตั้ง
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

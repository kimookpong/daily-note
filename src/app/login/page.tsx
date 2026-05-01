import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export const metadata = { title: "เข้าสู่ระบบ — Daily Note" };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="h-dvh flex flex-col overflow-y-auto bg-gradient-to-b from-[#1B3B6F] via-[#16336A] to-[#0D2350]">
      {/* Decorative circles */}
      <div className="absolute top-16 right-8 w-32 h-32  bg-white/5 -z-0 pointer-events-none" />
      <div className="absolute bottom-1/3 left-4 w-48 h-48  bg-white/5 -z-0 pointer-events-none" />

      {/* Splash hero — compact on mobile so the card stays visible */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-8 sm:py-16">
        <Image
          src="/logo.png"
          alt="Daily Note"
          width={120}
          height={120}
          className="w-24 h-24 sm:w-32 sm:h-32 drop-shadow-xl mb-1"
          priority
        />
        <p className="text-blue-200 text-md text-center leading-relaxed">
          ระบบบันทึกงาน
          <br />
          สมาชิกสภาเทศบาล
        </p>
      </div>

      {/* Login card */}
      <div className="bg-white rounded-t-[2.5rem] px-6 pt-8 pb-10 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900 mb-4">เข้าสู่ระบบ</h2>

        {/* Google — shown first so it's always visible without scrolling */}
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 py-3.5 bg-white border border-slate-200  text-md font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            เข้าสู่ระบบด้วย Google
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-400">หรือ</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Credentials */}
        <form
          action={async (formData: FormData) => {
            "use server";
            await signIn("credentials", {
              username: formData.get("username"),
              password: formData.get("password"),
              redirectTo: "/dashboard",
            });
          }}
          className="space-y-2"
        >
          <input
            name="username"
            type="text"
            placeholder="Username"
            autoComplete="username"
            required
            className="w-full px-4 py-3 bg-[#F0F5FF] border border-slate-200  text-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/30 focus:border-[#1B3B6F]"
          />
          <input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full px-4 py-3 bg-[#F0F5FF] border border-slate-200  text-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1B3B6F]/30 focus:border-[#1B3B6F]"
          />
          <button
            type="submit"
            className="w-full py-3.5 bg-[#1B3B6F] hover:bg-[#163260] text-white font-semibold  text-md transition-colors shadow-md shadow-[#1B3B6F]/30"
          >
            เข้าสู่ระบบ
          </button>
        </form>
      </div>
    </main>
  );
}

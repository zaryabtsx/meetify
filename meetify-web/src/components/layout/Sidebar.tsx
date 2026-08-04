"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mic, ListChecks, Plus, LogOut, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/meetings", label: "Meetings", icon: ListChecks },
  { href: "/meetings/new", label: "New meeting", icon: Plus },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  const initials =
    user?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex items-center justify-between px-5 py-5 lg:justify-start">
        <Link href="/meetings" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Mic className="h-[18px] w-[18px]" />
          </div>
          <span className="font-display text-[17px] font-semibold text-ink">Meetify</span>
        </Link>
        <button
          onClick={onNavigate}
          className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {navItems.map((item) => {
          const active =
            item.href === "/meetings"
              ? pathname === "/meetings"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                active
                  ? "bg-primary-tint text-primary"
                  : "text-ink-soft hover:bg-canvas hover:text-ink"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-tint text-[13px] font-bold text-accent">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold text-ink">
              {user?.full_name ?? "—"}
            </p>
            <p className="truncate text-[12px] text-ink-faint">{user?.email ?? ""}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-danger hover:bg-danger-tint cursor-pointer"
        >
          <LogOut className="h-[18px] w-[18px]" />
          Sign out
        </button>
      </div>
    </div>
  );
}

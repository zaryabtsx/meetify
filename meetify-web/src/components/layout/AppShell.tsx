"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { Sidebar } from "./Sidebar";
import { MobileMenuContext } from "./MobileMenuContext";
import { Mic } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 animate-orb-breathe items-center justify-center rounded-2xl bg-primary text-white">
            <Mic className="h-6 w-6" />
          </div>
          <p className="text-[14px] text-ink-soft">Loading Meetify…</p>
        </div>
      </div>
    );
  }

  return (
    <MobileMenuContext.Provider value={{ openMenu: () => setMenuOpen(true) }}>
      <div className="flex h-screen w-full overflow-hidden bg-canvas">
        {/* Desktop sidebar */}
        <div className="hidden w-[264px] shrink-0 border-r border-border lg:block">
          <Sidebar />
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-ink/40"
              onClick={() => setMenuOpen(false)}
              aria-hidden
            />
            <div className="absolute inset-y-0 left-0 w-[280px] shadow-[var(--shadow-elevated)]">
              <Sidebar onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}

        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </MobileMenuContext.Provider>
  );
}

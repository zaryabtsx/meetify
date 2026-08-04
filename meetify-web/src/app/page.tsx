"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { Mic } from "lucide-react";

export default function RootPage() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!hydrated) return;
    router.replace(token ? "/meetings" : "/login");
  }, [hydrated, token, router]);

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

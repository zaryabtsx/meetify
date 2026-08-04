"use client";

import { useToastStore, type ToastKind } from "@/lib/store/toastStore";
import { cn } from "@/lib/utils/cn";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

const iconByKind: Record<ToastKind, React.ElementType> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const styleByKind: Record<ToastKind, string> = {
  success: "border-success/25 bg-success-tint text-success",
  warning: "border-warning/25 bg-warning-tint text-warning",
  error: "border-danger/25 bg-danger-tint text-danger",
  info: "border-info/25 bg-info-tint text-info",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:top-5">
      {toasts.map((t) => {
        const Icon = iconByKind[t.kind];
        return (
          <div
            key={t.id}
            className={cn(
              "animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[var(--shadow-elevated)] bg-surface",
              styleByKind[t.kind]
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1 text-[13px] leading-snug text-ink">
              {t.title && <p className="font-semibold">{t.title}</p>}
              <p className="text-ink-soft">{t.message}</p>
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-0.5 text-ink-faint hover:text-ink-soft cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

"use client";

import { useDialogStore } from "@/lib/store/dialogStore";
import { Button } from "./Button";

export function ConfirmDialogHost() {
  const { open, options, resolve } = useDialogStore();

  if (!open || !options) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-[var(--shadow-elevated)]">
        <h3 className="font-display text-lg font-semibold text-ink">{options.title}</h3>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{options.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => resolve(false)}>
            {options.cancelLabel ?? "Cancel"}
          </Button>
          <Button variant={options.danger ? "danger" : "primary"} onClick={() => resolve(true)}>
            {options.confirmLabel ?? "Confirm"}
          </Button>
        </div>
      </div>
    </div>
  );
}

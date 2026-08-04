"use client";

import { Menu } from "lucide-react";
import { ReactNode } from "react";

export function Topbar({
  title,
  subtitle,
  onMenuClick,
  actions,
}: {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-ink sm:text-xl">{title}</h1>
          {subtitle && <p className="text-[13px] text-ink-soft">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils/cn";
import { HTMLAttributes } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "onClick"> {
  onPress?: () => void;
  padded?: boolean;
}

export function Card({ className, onPress, padded = true, children, ...props }: CardProps) {
  const cardClassName = cn(
    "rounded-2xl border border-border bg-surface shadow-[var(--shadow-card)]",
    padded && "p-5",
    onPress &&
      "w-full text-left transition-all hover:border-border-strong hover:shadow-[var(--shadow-elevated)] cursor-pointer",
    className
  );

  if (onPress) {
    return (
      <button
        onClick={onPress}
        className={cardClassName}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={cardClassName} {...props}>
      {children}
    </div>
  );
}

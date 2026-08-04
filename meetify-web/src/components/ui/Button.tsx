"use client";

import { cn } from "@/lib/utils/cn";
import { Loader2 } from "lucide-react";
import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

type Variant = "primary" | "outline" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
  icon?: ReactNode;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-hover active:bg-primary-hover disabled:bg-primary/50",
  outline:
    "bg-transparent text-primary border border-primary/40 hover:bg-primary-tint disabled:opacity-50",
  ghost: "bg-transparent text-primary hover:bg-primary-tint disabled:opacity-50",
  danger:
    "bg-danger text-white hover:bg-danger/90 active:bg-danger/90 disabled:bg-danger/50",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading, disabled, icon, fullWidth, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-[15px] font-semibold transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed select-none",
        variantClasses[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        icon && <span className="inline-flex">{icon}</span>
      )}
      <span>{children}</span>
    </button>
  );
});

"use client";

import { cn } from "@/lib/utils/cn";
import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, className, id, ...props },
  ref
) {
  const inputId = id ?? props.name;
  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-ink-soft"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          "w-full rounded-xl border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors",
          "border-border focus:border-primary focus:ring-2 focus:ring-primary/15",
          error && "border-danger focus:border-danger focus:ring-danger/15",
          className
        )}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-[12px] text-ink-faint">{hint}</p>}
      {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, className, id, rows = 3, ...props }, ref) {
    const inputId = id ?? props.name;
    return (
      <div className="mb-4">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-[12px] font-semibold uppercase tracking-wide text-ink-soft"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={cn(
            "w-full resize-none rounded-xl border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-ink-faint outline-none transition-colors",
            "border-border focus:border-primary focus:ring-2 focus:ring-primary/15",
            error && "border-danger focus:border-danger focus:ring-danger/15",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-danger">{error}</p>}
      </div>
    );
  }
);

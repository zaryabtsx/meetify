import { cn } from "@/lib/utils/cn";

export type BadgeType =
  | "task"
  | "meeting"
  | "deadline"
  | "decision"
  | "success"
  | "warning"
  | "error"
  | "neutral";

const badgeClasses: Record<BadgeType, string> = {
  task: "bg-task-tint text-task",
  meeting: "bg-meeting-type-tint text-meeting-type",
  deadline: "bg-deadline-tint text-deadline",
  decision: "bg-decision-tint text-decision",
  success: "bg-success-tint text-success",
  warning: "bg-warning-tint text-warning",
  error: "bg-danger-tint text-danger",
  neutral: "bg-canvas text-ink-soft",
};

export function Badge({ label, type }: { label: string; type: BadgeType | string }) {
  const cls = badgeClasses[type as BadgeType] ?? badgeClasses.neutral;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide",
        cls
      )}
    >
      {label}
    </span>
  );
}

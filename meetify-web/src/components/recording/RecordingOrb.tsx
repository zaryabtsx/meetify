import { cn } from "@/lib/utils/cn";
import { Mic, Square, Cloud, PenLine, Brain, Check, AlertTriangle } from "lucide-react";

export type RecordingPhase =
  | "ready"
  | "recording"
  | "uploading"
  | "transcribing"
  | "classifying"
  | "done"
  | "warning";

const phaseConfig: Record<
  RecordingPhase,
  { icon: React.ElementType; ring: string; ringBg: string }
> = {
  ready: { icon: Mic, ring: "border-border text-primary", ringBg: "bg-surface" },
  recording: { icon: Square, ring: "border-danger text-danger", ringBg: "bg-danger-tint" },
  uploading: { icon: Cloud, ring: "border-primary text-primary", ringBg: "bg-primary-tint" },
  transcribing: { icon: PenLine, ring: "border-primary text-primary", ringBg: "bg-primary-tint" },
  classifying: { icon: Brain, ring: "border-primary text-primary", ringBg: "bg-primary-tint" },
  done: { icon: Check, ring: "border-success text-success", ringBg: "bg-success-tint" },
  warning: { icon: AlertTriangle, ring: "border-warning text-warning", ringBg: "bg-warning-tint" },
};

export function RecordingOrb({ phase }: { phase: RecordingPhase }) {
  const { icon: Icon, ring, ringBg } = phaseConfig[phase];
  const isRecording = phase === "recording";
  const isBusy = phase === "uploading" || phase === "transcribing" || phase === "classifying";

  return (
    <div className="relative flex h-40 w-40 items-center justify-center">
      {isRecording && (
        <>
          <span className="absolute inset-0 animate-ring-pulse rounded-full border-2 border-danger" />
          <span
            className="absolute inset-0 animate-ring-pulse rounded-full border-2 border-danger"
            style={{ animationDelay: "1.1s" }}
          />
        </>
      )}
      {isBusy && (
        <span className="absolute inset-0 rounded-full border-2 border-primary/30 [animation:spin_2.2s_linear_infinite]" />
      )}
      <div
        className={cn(
          "relative flex h-28 w-28 items-center justify-center rounded-full border-2 shadow-[var(--shadow-card)] transition-colors duration-300",
          ring,
          ringBg,
          phase === "ready" && "animate-orb-breathe"
        )}
      >
        <Icon className={cn("h-10 w-10", isRecording && "fill-current")} strokeWidth={1.75} />
      </div>
    </div>
  );
}

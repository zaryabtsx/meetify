"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeType } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { integrationService, transcriptionService } from "@/lib/api/services";
import { getFriendlyMessage, formatDate } from "@/lib/utils/format";
import { toast } from "@/lib/store/toastStore";
import { confirmDialog } from "@/lib/store/dialogStore";
import type { ActionItem, ClassificationResult, Meeting } from "@/lib/types";
import {
  CalendarDays,
  Search,
  ChevronDown,
  ChevronUp,
  User,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const confidenceBadge: Record<ActionItem["confidence"], BadgeType> = {
  high: "success",
  medium: "warning",
  low: "error",
};

export function ResultsView({
  meeting,
  transcriptId,
  transcript,
  result,
}: {
  meeting: Meeting;
  transcriptId?: string | null;
  transcript?: string | null;
  result?: ClassificationResult | null;
}) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [lang, setLang] = useState<"en" | "ur">("en");
  const [urduText, setUrduText] = useState<string | null>(null);
  const [loadingUrdu, setLoadingUrdu] = useState(false);

  const actionItems = result?.action_items ?? [];
  const count = result?.action_items_count ?? actionItems.length;

  // ─── Urdu Translation ────────────────────────────────────────────────────
  async function handleUrduToggle() {
    if (lang === "ur") {
      setLang("en");
      return;
    }
    if (urduText) {
      setLang("ur");
      return;
    }
    if (!transcriptId) {
      toast.warning("No transcript ID is available for translation.");
      return;
    }

    setLoadingUrdu(true);
    try {
      const res = await transcriptionService.translateToUrdu(transcriptId);
      const text =
        res?.transcript ??
        res?.urdu_transcript ??
        res?.text ??
        res?.data?.transcript ??
        res?.data?.urdu_transcript ??
        res?.data?.text ??
        "";

      if (!text) {
        toast.warning(
          "The server returned an empty translation. Please try again later.",
          "Translation warning"
        );
        return;
      }
      setUrduText(text);
      setLang("ur");
    } catch (e) {
      toast.warning(
        getFriendlyMessage(e, "Failed to load Urdu translation. Please try again."),
        "Translation warning"
      );
    } finally {
      setLoadingUrdu(false);
    }
  }

  // ─── Google Calendar Sync ────────────────────────────────────────────────
  async function handleCalendarSync() {
    if (!transcriptId) {
      toast.warning("Cannot push to calendar without a transcript ID.", "No transcript");
      return;
    }

    setPushing(true);
    try {
      const { auth_url } = await integrationService.getGoogleAuthUrl();

      const popup = window.open(auth_url, "_blank", "noopener,noreferrer");
      if (!popup) {
        toast.warning(
          "Couldn't open Google sign-in. Please allow pop-ups for this site and try again."
        );
        return;
      }

      const shouldPush = await confirmDialog({
        title: "Google Calendar",
        message:
          'Complete Google sign-in in the new tab, then choose "Push to calendar" to sync your action items.',
        confirmLabel: "Push to calendar",
        cancelLabel: "Cancel",
      });

      if (!shouldPush) return;

      try {
        const res = await integrationService.pushToCalendar(transcriptId);
        const message = res.message
          ? res.message
          : `${res.pushed_count ?? 0} event(s) added to Google Calendar.${
              (res.failed_count ?? 0) > 0 ? ` ${res.failed_count} failed.` : ""
            }`;
        toast.success(message, "Calendar sync");
      } catch (e) {
        toast.warning(
          getFriendlyMessage(e, "Failed to push to calendar. Please try again."),
          "Sync warning"
        );
      }
    } catch (err) {
      toast.warning(getFriendlyMessage(err, "Something went wrong. Please try again."));
    } finally {
      setPushing(false);
    }
  }

  const displayedTranscript = lang === "ur" ? urduText : transcript;

  return (
    <div>
      {/* Summary card */}
      <Card className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">{meeting.subject}</h2>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-display text-4xl font-bold text-primary">{count}</span>
          <span className="text-[14px] text-ink-soft">
            action item{count !== 1 ? "s" : ""} extracted
          </span>
        </div>
        <Button
          variant="outline"
          fullWidth
          loading={pushing}
          icon={<CalendarDays className="h-4 w-4" />}
          onClick={handleCalendarSync}
          className="mt-4"
        >
          Sync to Google Calendar
        </Button>
      </Card>

      {/* Action items */}
      <h3 className="mb-3 font-display text-[16px] font-semibold text-ink">Action items</h3>
      {actionItems.length === 0 ? (
        <EmptyState
          icon={<Search className="h-6 w-6" />}
          title="No action items found"
          subtitle="The transcript had no detectable tasks or events."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {actionItems.map((item) => (
            <Card key={item.id}>
              <div className="mb-2.5 flex flex-wrap items-center gap-2">
                <Badge label={item.item_type} type={item.item_type} />
                <Badge label={item.confidence} type={confidenceBadge[item.confidence]} />
                {item.pushed_to_calendar && item.calendar_provider && (
                  <Badge label={item.calendar_provider} type="success" />
                )}
              </div>
              <h4 className="font-display text-[15px] font-semibold text-ink">{item.title}</h4>
              <p className="mt-1 text-[14px] text-ink-soft">{item.description}</p>

              {item.assignee && (
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <User className="h-3.5 w-3.5" /> {item.assignee}
                </p>
              )}
              {item.due_date && (
                <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-soft">
                  <CalendarDays className="h-3.5 w-3.5" /> Due: {formatDate(item.due_date)}
                </p>
              )}
              {item.pushed_to_calendar && (
                <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Synced to{" "}
                  {item.calendar_provider ?? "calendar"}
                </p>
              )}
              <p className="mt-3 border-l-2 border-border pl-3 text-[12px] italic text-ink-faint">
                &ldquo;{item.source_text}&rdquo;
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Transcript toggle */}
      <button
        onClick={() => setShowTranscript((v) => !v)}
        className="mt-4 flex w-full items-center justify-center gap-1.5 py-3 text-[13px] font-semibold text-primary cursor-pointer"
      >
        {showTranscript ? (
          <>
            Hide transcript <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            View full transcript <ChevronDown className="h-4 w-4" />
          </>
        )}
      </button>

      {showTranscript && (
        <>
          <div className="mb-3 flex justify-center gap-2">
            <button
              onClick={() => setLang("en")}
              className={
                "min-w-[84px] rounded-full border px-4 py-1.5 text-[13px] font-semibold cursor-pointer " +
                (lang === "en"
                  ? "border-primary bg-primary text-white"
                  : "border-border text-ink-soft hover:bg-canvas")
              }
            >
              English
            </button>
            <button
              onClick={handleUrduToggle}
              disabled={loadingUrdu}
              className={
                "min-w-[84px] rounded-full border px-4 py-1.5 text-[13px] font-semibold cursor-pointer disabled:opacity-60 " +
                (lang === "ur"
                  ? "border-primary bg-primary text-white"
                  : "border-border text-ink-soft hover:bg-canvas")
              }
            >
              {loadingUrdu ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                "اردو"
              )}
            </button>
          </div>

          <Card>
            <p
              className={
                lang === "ur"
                  ? "text-right text-[14px] leading-8 text-ink-soft"
                  : "text-[14px] leading-relaxed text-ink-soft"
              }
              dir={lang === "ur" ? "rtl" : "ltr"}
            >
              {displayedTranscript ?? "Transcript not available."}
            </p>
          </Card>
        </>
      )}
    </div>
  );
}

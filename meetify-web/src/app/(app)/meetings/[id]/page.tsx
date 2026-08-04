"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useMobileMenu } from "@/components/layout/MobileMenuContext";
import { Card } from "@/components/ui/Card";
import { ResultsView } from "@/components/results/ResultsView";
import { meetingService } from "@/lib/api/services";
import { getStoredResult } from "@/lib/utils/resultCache";
import { getFriendlyMessage, formatDate } from "@/lib/utils/format";
import { toast } from "@/lib/store/toastStore";
import type { ClassificationResult, Meeting } from "@/lib/types";
import { CalendarDays, MapPin, Users, Loader2 } from "lucide-react";

export default function MeetingDetailPage() {
  const params = useParams<{ id: string }>();
  const meetingId = params.id;
  const { openMenu } = useMobileMenu();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const [result, setResult] = useState<ClassificationResult | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await meetingService.get(meetingId);
        if (mounted) setMeeting(data);
      } catch (err) {
        toast.warning(getFriendlyMessage(err, "Failed to load meeting. Please try again."));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [meetingId]);

  useEffect(() => {
    const stored = getStoredResult(meetingId);
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage cache on mount
      setTranscriptId(stored.transcriptId);
      setTranscriptText(stored.transcript);
      setResult(stored.result);
    }
  }, [meetingId]);

  return (
    <>
      <Topbar title="Meeting" onMenuClick={openMenu} />

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : !meeting ? (
            <p className="text-center text-[14px] text-ink-soft">Meeting not found.</p>
          ) : (
            <>
              <Card className="mb-6">
                <h2 className="font-display text-lg font-semibold text-ink">{meeting.subject}</h2>
                <div className="mt-2 flex flex-col gap-1.5 text-[13px] text-ink-soft">
                  <p className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" /> {formatDate(meeting.created_at)}
                  </p>
                  {meeting.meeting_with && (
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> With: {meeting.meeting_with}
                    </p>
                  )}
                  {meeting.location && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> {meeting.location}
                    </p>
                  )}
                  {meeting.participants && meeting.participants.length > 0 && (
                    <p className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" /> {meeting.participants.join(", ")}
                    </p>
                  )}
                </div>
                {meeting.notes && (
                  <p className="mt-3 whitespace-pre-wrap text-[14px] text-ink">{meeting.notes}</p>
                )}
              </Card>

              {result || transcriptText ? (
                <ResultsView
                  meeting={meeting}
                  transcriptId={transcriptId}
                  transcript={transcriptText}
                  result={result}
                />
              ) : (
                <p className="text-center text-[14px] text-ink-soft">
                  No transcript found for this meeting yet.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

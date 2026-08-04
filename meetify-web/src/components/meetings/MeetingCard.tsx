import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/format";
import type { Meeting } from "@/lib/types";
import { CalendarDays, MapPin, Users } from "lucide-react";

export function MeetingCard({ meeting, onPress }: { meeting: Meeting; onPress: () => void }) {
  const participants = meeting.participants ?? [];

  return (
    <Card onPress={onPress}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-[16px] font-semibold text-ink line-clamp-1">
          {meeting.subject}
        </h3>
        <span className="shrink-0 text-[12px] text-ink-faint">
          {formatDate(meeting.created_at)}
        </span>
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {meeting.meeting_with && (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-soft">
            <Users className="h-3.5 w-3.5" /> {meeting.meeting_with}
          </p>
        )}
        {meeting.location && (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-faint">
            <MapPin className="h-3.5 w-3.5" /> {meeting.location}
          </p>
        )}
        {participants.length > 0 && (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-faint">
            <CalendarDays className="h-3.5 w-3.5" /> {participants.join(", ")}
          </p>
        )}
      </div>

      {meeting.classification_types?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {meeting.classification_types.map((t) => (
            <Badge key={t} label={t} type={t} />
          ))}
        </div>
      )}
    </Card>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useMobileMenu } from "@/components/layout/MobileMenuContext";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { meetingService } from "@/lib/api/services";
import { toast } from "@/lib/store/toastStore";
import { getFriendlyMessage } from "@/lib/utils/format";
import { ArrowRight } from "lucide-react";

export default function NewMeetingPage() {
  const router = useRouter();
  const { openMenu } = useMobileMenu();

  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [participantsText, setParticipantsText] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!subject.trim()) {
      toast.warning("Please enter a meeting subject.", "Required");
      return;
    }

    const participants = participantsText
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    setLoading(true);
    try {
      const payload: Parameters<typeof meetingService.create>[0] & {
        user_email?: string;
      } = { subject: subject.trim() };

      if (email.trim()) payload.user_email = email.trim();
      if (participants.length) payload.participants = participants;
      if (location.trim()) payload.location = location.trim();
      if (notes.trim()) payload.notes = notes.trim();

      const meeting = await meetingService.create(payload);
      router.replace(`/recording/${meeting.id}`);
    } catch (err) {
      toast.warning(getFriendlyMessage(err, "Please check the meeting details and try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="New meeting" subtitle="Pre-meeting form" onMenuClick={openMenu} />

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <p className="mb-5 text-[14px] text-ink-soft">
            Fill in a few details before you start recording. You can always add more later.
          </p>

          <Card>
            <form onSubmit={handleSubmit}>
              <Input
                label="Meeting subject *"
                placeholder="e.g. Q3 Marketing Plan Discussion"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="e.g. ahmed.khan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Participants"
                placeholder="Ahmed, Sara, Bilal (comma separated)"
                value={participantsText}
                onChange={(e) => setParticipantsText(e.target.value)}
              />
              <Input
                label="Location"
                placeholder="e.g. Lahore Office – Room 2"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Textarea
                label="Notes / agenda"
                placeholder="Optional pre-meeting notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />

              <Button
                type="submit"
                loading={loading}
                fullWidth
                icon={<ArrowRight className="h-4 w-4" />}
                className="mt-1"
              >
                Start recording
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}

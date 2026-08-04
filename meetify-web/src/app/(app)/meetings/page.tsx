"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";
import { useMobileMenu } from "@/components/layout/MobileMenuContext";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { MeetingCard } from "@/components/meetings/MeetingCard";
import { meetingService } from "@/lib/api/services";
import { useAuthStore } from "@/lib/store/authStore";
import { toast } from "@/lib/store/toastStore";
import { getFriendlyMessage } from "@/lib/utils/format";
import type { Meeting } from "@/lib/types";
import { Mic, Plus, RefreshCw } from "lucide-react";

export default function MeetingsPage() {
  const router = useRouter();
  const { openMenu } = useMobileMenu();
  const user = useAuthStore((s) => s.user);

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    try {
      const data = await meetingService.getAll();
      setMeetings(
        [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      );
    } catch (err) {
      toast.error(getFriendlyMessage(err, "Could not load meetings."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, [load]);

  const firstName = user?.full_name?.split(" ")[0];

  return (
    <>
      <Topbar
        title={`Hello, ${firstName ?? "there"} 👋`}
        subtitle="Your meeting recordings"
        onMenuClick={openMenu}
        actions={
          <>
            <button
              onClick={() => load(true)}
              className="rounded-lg p-2 text-ink-soft hover:bg-canvas cursor-pointer disabled:opacity-50"
              aria-label="Refresh"
              disabled={refreshing}
            >
              <RefreshCw className={`h-[18px] w-[18px] ${refreshing ? "animate-spin" : ""}`} />
            </button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => router.push("/meetings/new")}>
              New meeting
            </Button>
          </>
        }
      />

      <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-[140px] animate-pulse rounded-2xl border border-border bg-surface"
              />
            ))}
          </div>
        ) : meetings.length === 0 ? (
          <EmptyState
            icon={<Mic className="h-6 w-6" />}
            title="No meetings yet"
            subtitle="Start your first recording and let Meetify pull out the action items for you."
            action={
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => router.push("/meetings/new")}>
                New meeting
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                onPress={() => router.push(`/meetings/${meeting.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

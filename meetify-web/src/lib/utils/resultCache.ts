"use client";

import type { StoredMeetingResult } from "@/lib/types";

const keyFor = (meetingId: string) => `meetify:result:${meetingId}`;

export function saveStoredResult(meetingId: string, data: StoredMeetingResult) {
  try {
    localStorage.setItem(keyFor(meetingId), JSON.stringify(data));
  } catch {
    // localStorage can fail in private mode / quota errors — non-critical.
  }
}

export function getStoredResult(meetingId: string): StoredMeetingResult | null {
  try {
    const raw = localStorage.getItem(keyFor(meetingId));
    return raw ? (JSON.parse(raw) as StoredMeetingResult) : null;
  } catch {
    return null;
  }
}

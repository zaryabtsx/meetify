import { api, checkHealth, type ApiError } from "./client";
import type {
  AuthResponse,
  Meeting,
  ClassificationType,
  Recording,
  TranscriptionResponse,
  ClassificationResult,
  CalendarPushResult,
} from "@/lib/types";

// ─── Health Check ────────────────────────────────────────────────────────────
export const healthService = {
  check: () => checkHealth(),
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
  register: async (full_name: string, email: string, password: string) => {
    try {
      return await api.post<AuthResponse>("/auth/register", {
        full_name,
        email,
        password,
      });
    } catch (err) {
      const attempts = [
        { fullName: full_name, email, password },
        { name: full_name, email, password },
      ];
      for (const payload of attempts) {
        try {
          return await api.post<AuthResponse>("/auth/register", payload);
        } catch {
          // try next shape
        }
      }
      throw err as ApiError;
    }
  },

  login: async (email: string, password: string) => {
    try {
      return await api.post<AuthResponse>("/auth/login", { email, password });
    } catch (err) {
      const fallbackPayloads = [
        { username: email, password },
        { user: email, password },
      ];
      for (const p of fallbackPayloads) {
        try {
          return await api.post<AuthResponse>("/auth/login", p);
        } catch {
          // try next shape
        }
      }
      throw err as ApiError;
    }
  },
};

// ─── Meetings ─────────────────────────────────────────────────────────────────
export const meetingService = {
  create: (data: {
    subject: string;
    meeting_with?: string;
    participants?: string[];
    location?: string;
    notes?: string;
    classification_types?: ClassificationType[];
  }) => api.post<Meeting>("/meetings/", data),

  getAll: () => api.get<Meeting[]>("/meetings/"),

  get: async (meeting_id: string) => {
    try {
      return await api.get<Meeting>(`/meetings/${meeting_id}`);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 404) {
        try {
          return await api.get<Meeting>(`/meetings/${meeting_id}/`);
        } catch (fallbackErr) {
          if ((fallbackErr as ApiError).status !== 404) {
            throw fallbackErr;
          }
        }

        const meetings = await api.get<Meeting[]>("/meetings/");
        const meeting = meetings.find((item) => item.id === meeting_id);
        if (meeting) return meeting;
      }
      throw err as ApiError;
    }
  },
};

// ─── Recordings ───────────────────────────────────────────────────────────────
const EXT_BY_MIME: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "mp4",
  "audio/m4a": "m4a",
  "audio/wav": "wav",
  "audio/mpeg": "mp3",
  "audio/aac": "aac",
};

export const recordingService = {
  create: (meeting_id: string) => api.post<Recording>(`/recordings/${meeting_id}`),

  /** Fetch the latest device audio, then store it in the recording. */
  fetchFromDevice: async (recording_id: string) => {
    const response = await fetch("/api/audio/latest", { cache: "no-store" });
    if (!response.ok) {
      const error = new Error(
        response.status === 404
          ? "No audio is available. Connect the device and record audio first."
          : `Audio device request failed (${response.status})`
      ) as ApiError;
      error.status = response.status;
      throw error;
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      const error = new Error("The device returned an empty audio file.") as ApiError;
      error.status = 404;
      throw error;
    }

    return recordingService.upload(recording_id, blob);
  },

  /** Upload a recorded audio Blob captured via MediaRecorder in the browser. */
  upload: async (recording_id: string, blob: Blob) => {
    const mimeType = blob.type?.split(";")[0] || "audio/webm";
    const ext = EXT_BY_MIME[mimeType] ?? "webm";

    const formData = new FormData();
    const file = new File([blob], `recording.${ext}`, { type: mimeType });
    formData.append("file", file);

    return api.postForm<Recording>(`/recordings/${recording_id}/upload`, formData);
  },
};

// ─── Transcriptions ───────────────────────────────────────────────────────────
export const transcriptionService = {
  transcribe: (recording_id: string) =>
    api.post<TranscriptionResponse>(`/transcriptions/${recording_id}`),

  translateToUrdu: (transcript_id: string) =>
    api.post<{
      transcript?: string;
      urdu_transcript?: string;
      text?: string;
      data?: { transcript?: string; urdu_transcript?: string; text?: string };
    }>(`/transcriptions/${transcript_id}/urdu`),
};

// ─── Classifications ──────────────────────────────────────────────────────────
export const classificationService = {
  classify: (transcript_id: string) =>
    api.post<ClassificationResult>(`/classifications/${transcript_id}`),

  get: (transcript_id: string) =>
    api.get<ClassificationResult>(`/classifications/${transcript_id}`),
};

// ─── Google Calendar Integration ──────────────────────────────────────────────
export const integrationService = {
  getGoogleAuthUrl: () => api.get<{ auth_url: string }>("/integrations/google/connect"),

  pushToCalendar: (transcript_id: string) =>
    api.post<CalendarPushResult>(`/integrations/google/push/${transcript_id}`),
};

// ─────────────────────────────────────────────────────────────────────────────
// Types mirror the backend's Supabase schema.
// ─────────────────────────────────────────────────────────────────────────────

// TABLE: users
export interface User {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: "bearer";
  user: User;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: meetings
export type ClassificationType = "task" | "meeting" | "deadline" | "decision";

export interface Meeting {
  id: string;
  owner_id: string;
  meeting_with: string | null;
  participants: string[] | null;
  location: string | null;
  subject: string;
  notes: string | null;
  created_at: string;
  classification_types: ClassificationType[];
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: recordings
export type RecordingStatus =
  | "pending"
  | "uploading"
  | "uploaded"
  | "transcribing"
  | "transcribed"
  | "failed";

export interface Recording {
  id: string;
  meeting_id: string;
  storage_path: string | null;
  file_size_bytes: number | null;
  duration_seconds: number | null;
  status: RecordingStatus;
  error_message: string | null;
  created_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: transcripts
export interface Transcript {
  id: string;
  recording_id: string;
  full_text: string;
  language: string | null;
  created_at: string;
}

export interface TranscriptionResponse {
  transcript_id: string;
  recording_id: string;
  status: string;
  transcript: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: action_items
export type ActionItemType = "task" | "meeting" | "deadline" | "decision";
export type Confidence = "high" | "medium" | "low";

export interface ActionItem {
  id: string;
  transcript_id: string;
  item_type: ActionItemType;
  title: string;
  description: string;
  assignee: string | null;
  due_date: string | null;
  pushed_to_calendar: boolean;
  created_at: string;
  source_text: string;
  confidence: Confidence;
  calendar_event_id: string | null;
  calendar_provider: string | null;
}

export interface ClassificationResult {
  transcript_id: string;
  action_items_count: number;
  action_items: ActionItem[];
  message?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE: user_integrations
export interface UserIntegration {
  id: string;
  user_id: string;
  provider: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface CalendarPushResult {
  pushed_count: number;
  pushed: string[];
  failed_count: number;
  failed: { title: string; error: string }[];
  message?: string;
}

// Locally cached recording result (mirrors what RecordingScreen stashes)
export interface StoredMeetingResult {
  transcriptId: string;
  transcript: string;
  result: ClassificationResult;
}

// Endpoint map (BASE = http://127.0.0.1:8000/api/v1)
//
//   GET  /health                                    -> health check (HEALTH_URL)
//   POST /auth/register                             -> register
//   POST /auth/login                                -> login
//   POST /meetings/                                 -> create meeting
//   GET  /meetings/                                 -> list meetings
//   POST /recordings/{meeting_id}                   -> create recording row
//   POST /recordings/{recording_id}/upload          -> upload audio
//   POST /transcriptions/{recording_id}             -> transcribe
//   POST /transcriptions/{transcript_id}/urdu       -> Urdu translation
//   POST /classifications/{transcript_id}           -> extract action items
//   GET  /classifications/{transcript_id}           -> get action items
//   GET  /integrations/google/connect               -> get OAuth URL
//   POST /integrations/google/push/{transcript_id}  -> push to calendar

import { BASE_API_URL, HEALTH_URL, IS_DEV } from "@/lib/config/env";
import { getAuthToken } from "@/lib/store/authStore";

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

async function request<T>(
  method: string,
  path: string,
  body?: object | FormData,
  isFormData = false
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!isFormData) headers["Content-Type"] = "application/json";

  const url = `${BASE_API_URL}${path}`;

  if (IS_DEV) {
    console.log(`[API] ${method} ${url}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: isFormData
        ? (body as FormData)
        : body
        ? JSON.stringify(body)
        : undefined,
    });
  } catch (networkErr) {
    const err = networkErr as Error;
    throw new Error(`Network error — check your connection.\n${err.message}`);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    if (data?.detail) {
      message =
        typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
    } else if (data?.message) {
      message =
        typeof data.message === "string" ? data.message : JSON.stringify(data.message);
    } else if (data && Object.keys(data).length) {
      message = JSON.stringify(data);
    }

    if (IS_DEV) {
      console.error(`[API] ${response.status}:`, message, "response data:", data);
    }
    const err = new Error(message) as ApiError;
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: object) => request<T>("POST", path, body),
  postForm: <T>(path: string, form: FormData) => request<T>("POST", path, form, true),
};

export async function checkHealth(): Promise<{ status: string }> {
  let res: Response;
  try {
    res = await fetch(HEALTH_URL);
  } catch (err) {
    throw new Error(`Health check network error: ${(err as Error)?.message ?? err}`);
  }

  if (res.status === 404) {
    try {
      const fallbackUrl = `${BASE_API_URL}/health`;
      res = await fetch(fallbackUrl);
    } catch (err) {
      throw new Error(
        `Health check network error (fallback): ${(err as Error)?.message ?? err}`
      );
    }
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Health check failed (${res.status}): ${body}`);
  }

  return res.json();
}

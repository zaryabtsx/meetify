import type { ApiError } from "@/lib/api/client";

function detailToText(detail: unknown): string | undefined {
  if (!detail) return undefined;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "msg" in item) {
          return String((item as { msg: unknown }).msg);
        }
        return undefined;
      })
      .filter(Boolean)
      .join("\n");
  }
  if (typeof detail === "object" && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }
  return undefined;
}

/** Turn a raw API/network error into a message a user can act on. */
export function getFriendlyMessage(
  err: unknown,
  fallback = "Please try again in a moment."
): string {
  const apiErr = err as ApiError & { data?: { detail?: unknown; message?: unknown } };
  const detail = detailToText(apiErr?.data?.detail) || detailToText(apiErr?.data?.message);
  const rawMessage = detail || apiErr?.message || fallback;
  const message = String(rawMessage).replace(/^Error:\s*/i, "").trim();

  if (!message || /^request failed \(\d+\)$/i.test(message)) {
    return fallback;
  }

  if (/duplicate|already|exists|409|uploaded/i.test(message)) {
    return "This recording looks like it was already uploaded. Please continue with a new recording, or try again only if the previous upload did not complete.";
  }

  if (/network|failed to fetch|connection/i.test(message)) {
    return "Please check your internet connection and try again.";
  }

  return message;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatElapsed(totalSeconds: number): string {
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

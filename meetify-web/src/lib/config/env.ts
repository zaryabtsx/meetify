// Single source of truth for all environment variables.
// Every other file imports from here — never read process.env directly.

const API_URL_PROD =
  process.env.NEXT_PUBLIC_API_URL_PROD ??
  process.env.EXPO_PUBLIC_API_URL_PROD ??
  "https://emrchains.com/meeting-api-new";
const API_URL_LOCAL =
  process.env.NEXT_PUBLIC_API_URL_LOCAL ??
  process.env.EXPO_PUBLIC_API_URL_LOCAL ??
  "http://127.0.0.1:8000";
const ENV =
  process.env.NEXT_PUBLIC_ENV ?? process.env.EXPO_PUBLIC_ENV ?? "prod";
const API_PREFIX =
  process.env.NEXT_PUBLIC_API_PREFIX ?? process.env.EXPO_PUBLIC_API_PREFIX ?? "/api/v1";

export const IS_DEV = ENV === "local";

// prod  -> https://emrchains.com/meeting-api-new/api/v1
// local -> http://127.0.0.1:8000/api/v1
export const BASE_API_URL = IS_DEV
  ? `${API_URL_LOCAL}${API_PREFIX}`
  : `${API_URL_PROD}${API_PREFIX}`;

// Health check — no /api/v1 prefix
export const HEALTH_URL = IS_DEV
  ? `${API_URL_LOCAL}/health`
  : `${API_URL_PROD}/health`;

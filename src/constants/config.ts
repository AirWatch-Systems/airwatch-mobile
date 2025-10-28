/**
 * Global app configuration sourced from Expo "public" environment variables.
 *
 * Expo automatically injects variables prefixed with EXPO_PUBLIC_ into the JS bundle
 * as process.env.EXPO_PUBLIC_*. These are NOT secrets and will be visible in the app code.
 *
 * Required variables:
 * - EXPO_PUBLIC_API_URL
 * - EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
 *
 * Optional variables:
 * - EXPO_PUBLIC_REQUEST_TIMEOUT_MS (default: 15000)
 * - EXPO_PUBLIC_ENV (e.g., "development" | "staging" | "production")
 *
 * Important:
 * - Never put sensitive keys here. Follow the security checklist and keep secrets on the backend.
 */

type Milliseconds = number;

export interface AppConfig {
  apiUrl: string; // Base URL of the backend API (e.g., https://localhost:5000)
  googleMapsApiKey: string; // Public Google Maps key for mobile map SDKs
  requestTimeoutMs: Milliseconds; // Default HTTP request timeout
  env: "development" | "staging" | "production" | "test" | string; // Execution environment
}

/**
 * Reads a required public env var and throws an Error at startup if missing.
 * These are embedded at build time by Expo.
 */
function requirePublicEnv(name: string): string {
  const value = (process.env as Record<string, string | undefined>)[name];
  if (!value || String(value).trim().length === 0) {
    throw new Error(
      `[config] Missing required environment variable: ${name}. ` +
        `Define it in your app config or via .env with the EXPO_PUBLIC_ prefix.`
    );
  }
  return String(value).trim();
}

/**
 * Reads an optional public env var with a default value.
 */
function readPublicEnv(name: string, defaultValue: string): string {
  const value = (process.env as Record<string, string | undefined>)[name];
  return (value ?? defaultValue).toString().trim();
}

/**
 * Normalizes a base URL:
 * - Ensures it starts with http/https
 * - Removes trailing slash
 */
function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(
      `[config] EXPO_PUBLIC_API_URL must start with http:// or https://. Received: ${trimmed}`
    );
  }
  return trimmed.replace(/\/+$/, "");
}

/**
 * Parses a number from env with fallback and bounds.
 */
function parseNumber(value: string, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

const rawApiUrl = requirePublicEnv("EXPO_PUBLIC_API_URL");
const apiUrl = normalizeBaseUrl(rawApiUrl);

const googleMapsApiKey = requirePublicEnv("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY");

const requestTimeoutMs = parseNumber(
  readPublicEnv("EXPO_PUBLIC_REQUEST_TIMEOUT_MS", "15000"),
  15000,
  1000,
  120000
);

const env = readPublicEnv("EXPO_PUBLIC_ENV", (process.env.NODE_ENV as string) || "development");

/**
 * Exported app configuration object.
 */
export const CONFIG: AppConfig = {
  apiUrl,
  googleMapsApiKey,
  requestTimeoutMs,
  env,
};

if (__DEV__) {
  // Helpful runtime log (non-sensitive)
  console.log("[config] Loaded CONFIG:", {
    apiUrl: CONFIG.apiUrl,
    requestTimeoutMs: CONFIG.requestTimeoutMs,
    env: CONFIG.env,
    googleMapsApiKeyPresent: Boolean(CONFIG.googleMapsApiKey && CONFIG.googleMapsApiKey.length > 0),
  });
}

export default CONFIG;

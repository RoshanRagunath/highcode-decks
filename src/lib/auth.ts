// Shared-password session helpers. Pure Web Crypto (crypto.subtle) so the same
// code runs in both Next.js middleware (edge runtime) and route handlers, and
// natively on Cloudflare Workers — no Node-only crypto, no extra dependencies.

export const COOKIE_NAME = "gg_session";

// Session lifetime: 7 days.
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

function base64UrlEncode(bytes: ArrayBuffer): string {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return base64UrlEncode(signature);
}

// Constant-time string comparison to avoid leaking match length via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

// Returns a cookie value of the form "<exp>.<base64url-hmac>" where exp is the
// expiry epoch-ms. The HMAC is taken over the exp string so the cookie cannot be
// forged or its expiry extended without the secret.
export async function signSession(secret: string, expMs: number): Promise<string> {
  const exp = String(expMs);
  const sig = await hmac(secret, exp);
  return `${exp}.${sig}`;
}

export async function verifySession(
  secret: string | undefined,
  value: string | undefined
): Promise<boolean> {
  if (!secret || !value) return false;
  const dot = value.indexOf(".");
  if (dot < 1) return false;
  const exp = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  const expMs = Number(exp);
  if (!Number.isFinite(expMs) || expMs < Date.now()) return false;

  const expected = await hmac(secret, exp);
  return timingSafeEqual(sig, expected);
}

// Constant-time password check (re-exported for the login route).
export function passwordMatches(input: string, expected: string | undefined): boolean {
  if (!expected) return false;
  return timingSafeEqual(input, expected);
}

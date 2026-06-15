// Auth primitives. Pure Web Crypto (crypto.subtle) so the same code runs in both
// Next.js middleware (edge runtime) and route handlers, and natively on Cloudflare
// Workers — no Node-only crypto, no extra dependencies.

export const COOKIE_NAME = "gg_session";

// Session lifetime: 7 days.
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type Role = "admin" | "user";

export type SessionPayload = {
  uid: string;
  role: Role;
  exp: number; // expiry epoch-ms
};

const encoder = new TextEncoder();

function base64UrlEncode(bytes: ArrayBuffer): string {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i++) binary += String.fromCharCode(view[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlEncodeString(value: string): string {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecodeString(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(padded);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
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

// ── Session cookies ───────────────────────────────────────────────────────────
// Cookie value: "<base64url(json payload)>.<base64url-hmac>". The HMAC is taken
// over the encoded payload, so neither the user id, role, nor expiry can be
// tampered with or forged without the secret.

export async function signSession(secret: string, payload: SessionPayload): Promise<string> {
  const body = base64UrlEncodeString(JSON.stringify(payload));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

export async function verifySession(
  secret: string | undefined,
  value: string | undefined
): Promise<SessionPayload | null> {
  if (!secret || !value) return null;
  const dot = value.indexOf(".");
  if (dot < 1) return null;
  const body = value.slice(0, dot);
  const sig = value.slice(dot + 1);

  const expected = await hmac(secret, body);
  if (!timingSafeEqual(sig, expected)) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(base64UrlDecodeString(body)) as SessionPayload;
  } catch {
    return null;
  }

  if (
    typeof payload.uid !== "string" ||
    (payload.role !== "admin" && payload.role !== "user") ||
    typeof payload.exp !== "number" ||
    payload.exp < Date.now()
  ) {
    return null;
  }

  return payload;
}

// ── Password hashing (PBKDF2-SHA256) ────────────────────────────────────────────
// Stored format: "pbkdf2$<iterations>$<saltB64>$<hashB64>".

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH_BYTES = 32;
const PBKDF2_SALT_BYTES = 16;

async function deriveBits(
  password: string,
  salt: Uint8Array,
  iterations: number
): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    keyMaterial,
    PBKDF2_HASH_BYTES * 8
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const hash = await deriveBits(password, salt, PBKDF2_ITERATIONS);
  return `pbkdf2$${PBKDF2_ITERATIONS}$${bytesToBase64(salt)}$${bytesToBase64(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isInteger(iterations) || iterations <= 0) return false;

  let salt: Uint8Array;
  let expected: Uint8Array;
  try {
    salt = base64ToBytes(parts[2]);
    expected = base64ToBytes(parts[3]);
  } catch {
    return false;
  }

  const actual = await deriveBits(password, salt, iterations);
  // Constant-time compare over the base64 form.
  return timingSafeEqual(bytesToBase64(actual), bytesToBase64(expected));
}

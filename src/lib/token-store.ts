const TTL_MS = 60 * 60 * 1000; // 1 hour

interface DownloadEntry {
  buffer: Uint8Array;
  fileName: string;
  mimeType: string;
  expiresAt: number;
}

const store = new Map<string, DownloadEntry>();

export function putToken(
  buffer: Uint8Array,
  fileName: string,
  mimeType: string
): string {
  const token = crypto.randomUUID();
  store.set(token, { buffer, fileName, mimeType, expiresAt: Date.now() + TTL_MS });
  return token;
}

export function consumeToken(token: string): DownloadEntry | null {
  const entry = store.get(token);
  if (!entry) return null;
  store.delete(token); // single-use
  if (Date.now() > entry.expiresAt) return null;
  return entry;
}

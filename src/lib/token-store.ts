const TTL_MS = 60 * 60 * 1000; // 1 hour

interface DownloadEntry {
  downloadUrl: string;
  fileName: string;
  expiresAt: number;
}

const store = new Map<string, DownloadEntry>();

export function putToken(downloadUrl: string, fileName: string): string {
  const token = crypto.randomUUID();
  store.set(token, { downloadUrl, fileName, expiresAt: Date.now() + TTL_MS });
  return token;
}

export function consumeToken(token: string): DownloadEntry | null {
  const entry = store.get(token);
  if (!entry) return null;
  store.delete(token); // single-use
  if (Date.now() > entry.expiresAt) return null;
  return entry;
}

import { consumeToken } from "@/lib/token-store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const entry = consumeToken(token);

  if (!entry) {
    return new Response("Download link not found or expired.", { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(entry.downloadUrl, {
      signal: AbortSignal.timeout(60_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Failed to fetch file: ${message}`, { status: 502 });
  }

  if (!upstream.ok) {
    return new Response(`File source returned ${upstream.status}`, { status: 502 });
  }

  const contentType =
    upstream.headers.get("content-type") ?? "application/octet-stream";

  return new Response(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${entry.fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}

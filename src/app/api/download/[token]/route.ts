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

  return new Response(entry.buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": entry.mimeType,
      "Content-Disposition": `attachment; filename="${entry.fileName}"`,
      "Content-Length": String(entry.buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

export const maxDuration = 120;

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
]);

export async function POST(req: Request) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const prompt = formData.get("prompt") as string | null;

  if (!file && !prompt?.trim()) {
    return Response.json(
      { error: "Provide a file or a prompt" },
      { status: 400 }
    );
  }

  if (file) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json(
        { error: "Unsupported file type. Upload a PDF, DOCX, TXT, or MD file." },
        { status: 415 }
      );
    }
    if (file.size > 4 * 1024 * 1024) {
      return Response.json(
        { error: "File too large. Maximum size is 4 MB." },
        { status: 413 }
      );
    }
  }

  const outgoing = new FormData();
  if (file) outgoing.append("file", file, file.name);
  if (prompt?.trim()) outgoing.append("prompt", prompt.trim());

  let n8nRes: Response;
  try {
    n8nRes = await fetch(webhookUrl, {
      method: "POST",
      body: outgoing,
      signal: AbortSignal.timeout(115_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request timed out";
    return Response.json(
      { error: `Could not reach the generation service: ${message}` },
      { status: 502 }
    );
  }

  if (!n8nRes.ok) {
    const body = await n8nRes.text().catch(() => "(unreadable)");
    return Response.json(
      { error: `Generation service error (${n8nRes.status}): ${body}` },
      { status: 502 }
    );
  }

  let data: unknown;
  try {
    data = await n8nRes.json();
  } catch {
    return Response.json(
      { error: "Generation service returned an unreadable response" },
      { status: 502 }
    );
  }

  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as Record<string, unknown>).url !== "string"
  ) {
    return Response.json(
      { error: "Generation service returned an unexpected response shape" },
      { status: 502 }
    );
  }

  return Response.json({ url: (data as { url: string }).url });
}

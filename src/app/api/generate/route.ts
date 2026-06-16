import mammoth from "mammoth";
import { getSession } from "@/lib/session";
import { findById, resolveThemeId } from "@/lib/users";

export const maxDuration = 120;

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  DOCX_MIME,
  "text/plain",
  "text/markdown",
]);

async function buildN8nRequest(
  file: File | null,
  prompt: string | null,
  themeId: string | null
): Promise<RequestInit> {
  // ── DOCX → extract text with mammoth, send as JSON prompt ──────────────
  if (file && file.type === DOCX_MIME) {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const { value: text } = await mammoth.extractRawText({ buffer });
    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: text, themeId }),
    };
  }

  // ── PDF / plain-text file → multipart FormData with "data" field ────────
  if (file) {
    const form = new FormData();
    form.append("data", file);
    if (themeId) form.append("themeId", themeId);
    return { method: "POST", body: form };
  }

  // ── Text prompt → JSON ───────────────────────────────────────────────────
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt!.trim(), themeId }),
  };
}

export async function POST(req: Request) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // Identify the logged-in user and resolve their current effective theme from the
  // DB (own override, else their group's theme), so an admin's theme change takes
  // effect immediately and a deleted user fails closed.
  const session = await getSession();
  const user = session ? await findById(session.uid) : null;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const themeId = await resolveThemeId(user);

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  const prompt = formData.get("prompt") as string | null;

  if (!file && !prompt?.trim()) {
    return Response.json({ error: "Provide a file or a prompt" }, { status: 400 });
  }

  if (file) {
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json(
        { error: "Unsupported file type. Upload a PDF, DOCX, TXT or MD file." },
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

  let n8nRequest: RequestInit;
  try {
    n8nRequest = await buildN8nRequest(file, prompt, themeId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json(
      { error: `Failed to prepare file: ${message}` },
      { status: 422 }
    );
  }

  let n8nRes: Response;
  try {
    n8nRes = await fetch(webhookUrl, n8nRequest);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed";
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

  let data: Record<string, unknown>;
  try {
    data = (await n8nRes.json()) as Record<string, unknown>;
  } catch {
    return Response.json(
      { error: "Generation service returned an unreadable response" },
      { status: 502 }
    );
  }

  const fileData =
    typeof data.fileBase64 === "string" ? data.fileBase64 :
    typeof data.fileData   === "string" ? data.fileData   : null;

  const fileName =
    typeof data.fileName === "string" && data.fileName.trim()
      ? data.fileName.trim()
      : "presentation.pptx";

  const mimeType =
    typeof data.mimeType === "string" && data.mimeType.trim()
      ? data.mimeType.trim()
      : "application/vnd.openxmlformats-officedocument.presentationml.presentation";

  if (!fileData) {
    return Response.json(
      {
        error: `Generation service returned an unexpected response. Received keys: ${Object.keys(data).join(", ")}`,
      },
      { status: 502 }
    );
  }

  let buffer: Uint8Array;
  try {
    const binary = atob(fileData);
    buffer = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buffer[i] = binary.charCodeAt(i);
  } catch {
    return Response.json(
      { error: "Generation service returned invalid file data" },
      { status: 502 }
    );
  }

  return new Response(buffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "no-store",
    },
  });
}

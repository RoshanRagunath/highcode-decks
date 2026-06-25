// D1-backed generation history. Like users.ts, this is the only place that knows
// the SQL for the `generations` table; the rest of the app works with the camelCase
// `Generation` type below.

import { getCloudflareContext } from "@opennextjs/cloudflare";

export type GenerationStatus = "ok" | "error";

export type Generation = {
  id: string;
  userId: string | null;
  username: string;
  userName: string;
  kind: "file" | "prompt";
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  promptExcerpt: string | null;
  themeId: string | null;
  status: GenerationStatus;
  error: string | null;
  createdAt: number;
};

type GenerationRow = {
  id: string;
  user_id: string | null;
  username: string;
  user_name: string;
  kind: string;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  prompt_excerpt: string | null;
  theme_id: string | null;
  status: string;
  error: string | null;
  created_at: number;
};

function db() {
  return getCloudflareContext().env.DB;
}

function rowToGeneration(row: GenerationRow): Generation {
  return {
    id: row.id,
    userId: row.user_id,
    username: row.username,
    userName: row.user_name,
    kind: row.kind === "file" ? "file" : "prompt",
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    promptExcerpt: row.prompt_excerpt,
    themeId: row.theme_id,
    status: row.status === "ok" ? "ok" : "error",
    error: row.error,
    createdAt: row.created_at,
  };
}

export type RecordGenerationInput = {
  userId: string | null;
  username: string;
  userName: string;
  kind: "file" | "prompt";
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  promptExcerpt?: string | null;
  themeId?: string | null;
  status: GenerationStatus;
  error?: string | null;
};

export async function recordGeneration(input: RecordGenerationInput): Promise<void> {
  await db()
    .prepare(
      `INSERT INTO generations
        (id, user_id, username, user_name, kind, file_name, file_type, file_size,
         prompt_excerpt, theme_id, status, error, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      crypto.randomUUID(),
      input.userId,
      input.username,
      input.userName,
      input.kind,
      input.fileName ?? null,
      input.fileType ?? null,
      input.fileSize ?? null,
      input.promptExcerpt ?? null,
      input.themeId ?? null,
      input.status,
      input.error ?? null,
      Date.now()
    )
    .run();
}

// Most recent generations first. Capped so the admin page stays fast.
export async function listGenerations(limit = 200): Promise<Generation[]> {
  const { results } = await db()
    .prepare("SELECT * FROM generations ORDER BY created_at DESC LIMIT ?")
    .bind(limit)
    .all<GenerationRow>();
  return (results ?? []).map(rowToGeneration);
}

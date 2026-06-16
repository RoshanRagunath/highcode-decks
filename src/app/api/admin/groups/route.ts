import { getSession } from "@/lib/session";
import { createGroup, findGroupByName, listGroups } from "@/lib/users";

async function requireAdmin(): Promise<Response | null> {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const groups = await listGroups();
  return Response.json({ groups });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: { name?: unknown; themeId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const themeId =
    typeof body.themeId === "string" && body.themeId.trim() ? body.themeId.trim() : null;

  if (!name) {
    return Response.json({ error: "A group name is required." }, { status: 400 });
  }

  if (await findGroupByName(name)) {
    return Response.json({ error: "That group name is already taken." }, { status: 409 });
  }

  const group = await createGroup({ name, themeId });
  return Response.json({ group }, { status: 201 });
}

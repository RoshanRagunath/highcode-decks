import { getSession } from "@/lib/session";
import {
  deleteGroup,
  findGroupById,
  findGroupByName,
  updateGroup,
  type UpdateGroupInput,
} from "@/lib/users";

async function requireAdmin(): Promise<Response | null> {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const target = await findGroupById(id);
  if (!target) return Response.json({ error: "Group not found." }, { status: 404 });

  let body: { name?: unknown; themeId?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch: UpdateGroupInput = {};
  if (typeof body.name === "string" && body.name.trim()) {
    const name = body.name.trim();
    const clash = await findGroupByName(name);
    if (clash && clash.id !== id) {
      return Response.json({ error: "That group name is already taken." }, { status: 409 });
    }
    patch.name = name;
  }
  if (typeof body.themeId === "string")
    patch.themeId = body.themeId.trim() ? body.themeId.trim() : null;

  await updateGroup(id, patch);
  const updated = await findGroupById(id);
  return Response.json({ group: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;

  const target = await findGroupById(id);
  if (!target) return Response.json({ error: "Group not found." }, { status: 404 });

  await deleteGroup(id);
  return Response.json({ ok: true });
}

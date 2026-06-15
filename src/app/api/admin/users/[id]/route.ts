import { getSession } from "@/lib/session";
import {
  deleteUser,
  findById,
  toPublicUser,
  updateUser,
  type Role,
  type UpdateUserInput,
} from "@/lib/users";
import type { SessionPayload } from "@/lib/auth";

async function requireAdmin(): Promise<
  { error: Response } | { session: SessionPayload }
> {
  const session = await getSession();
  if (!session) return { error: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.role !== "admin")
    return { error: Response.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { id } = await params;

  const target = await findById(id);
  if (!target) return Response.json({ error: "User not found." }, { status: 404 });

  let body: {
    name?: unknown;
    themeId?: unknown;
    role?: unknown;
    password?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const patch: UpdateUserInput = {};
  if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim();
  if (typeof body.themeId === "string")
    patch.themeId = body.themeId.trim() ? body.themeId.trim() : null;
  if (body.role === "admin" || body.role === "user") patch.role = body.role as Role;
  if (typeof body.password === "string" && body.password) {
    if (body.password.length < 8) {
      return Response.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }
    patch.password = body.password;
  }

  // Prevent locking yourself out by demoting your own admin account.
  if (guard.session.uid === id && patch.role === "user") {
    return Response.json(
      { error: "You cannot remove your own admin role." },
      { status: 400 }
    );
  }

  await updateUser(id, patch);
  const updated = await findById(id);
  return Response.json({ user: updated ? toPublicUser(updated) : null });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("error" in guard) return guard.error;
  const { id } = await params;

  // Prevent deleting your own account (and thus a possible lockout).
  if (guard.session.uid === id) {
    return Response.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  const target = await findById(id);
  if (!target) return Response.json({ error: "User not found." }, { status: 404 });

  await deleteUser(id);
  return Response.json({ ok: true });
}

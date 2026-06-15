import { getSession } from "@/lib/session";
import {
  createUser,
  ensureSeeded,
  findByUsername,
  listUsers,
  toPublicUser,
  type Role,
} from "@/lib/users";

async function requireAdmin(): Promise<Response | null> {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  await ensureSeeded();
  const users = await listUsers();
  return Response.json({ users: users.map(toPublicUser) });
}

export async function POST(req: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  let body: {
    username?: unknown;
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

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const themeId =
    typeof body.themeId === "string" && body.themeId.trim() ? body.themeId.trim() : null;
  const role: Role = body.role === "admin" ? "admin" : "user";
  const password = typeof body.password === "string" ? body.password : "";

  if (!username || !name || password.length < 8) {
    return Response.json(
      { error: "username, name, and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  if (await findByUsername(username)) {
    return Response.json({ error: "That username is already taken." }, { status: 409 });
  }

  const user = await createUser({ username, name, themeId, role, password });
  return Response.json({ user: toPublicUser(user) }, { status: 201 });
}

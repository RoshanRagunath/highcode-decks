import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_TTL_MS,
  signSession,
  verifyPassword,
} from "@/lib/auth";
import { ensureSeeded, findByUsername } from "@/lib/users";

export async function POST(req: Request) {
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let body: { username?: unknown; password?: unknown };
  try {
    body = (await req.json()) as { username?: unknown; password?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!username || !password) {
    return Response.json(
      { error: "Incorrect username or password." },
      { status: 401 }
    );
  }

  // Bootstrap the first admin from env on the very first login.
  await ensureSeeded();

  const user = await findByUsername(username);
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    return Response.json(
      { error: "Incorrect username or password." },
      { status: 401 }
    );
  }

  const value = await signSession(authSecret, {
    uid: user.id,
    role: user.role,
    exp: Date.now() + SESSION_TTL_MS,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return Response.json({ ok: true, role: user.role });
}

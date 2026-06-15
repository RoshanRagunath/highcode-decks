import { cookies } from "next/headers";
import {
  COOKIE_NAME,
  SESSION_TTL_MS,
  passwordMatches,
  signSession,
} from "@/lib/auth";

export async function POST(req: Request) {
  const accessPassword = process.env.ACCESS_PASSWORD;
  const authSecret = process.env.AUTH_SECRET;
  if (!accessPassword || !authSecret) {
    return Response.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  let body: { password?: unknown };
  try {
    body = (await req.json()) as { password?: unknown };
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }

  const password = typeof body.password === "string" ? body.password : "";
  if (!passwordMatches(password, accessPassword)) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const expMs = Date.now() + SESSION_TTL_MS;
  const value = await signSession(authSecret, expMs);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });

  return Response.json({ ok: true });
}

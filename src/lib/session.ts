// Server-side current-session helper for route handlers (Node runtime).
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession, type SessionPayload } from "@/lib/auth";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return verifySession(process.env.AUTH_SECRET, token);
}

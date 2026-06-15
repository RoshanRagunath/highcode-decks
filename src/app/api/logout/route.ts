import { cookies } from "next/headers";
import { COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return Response.json({ ok: true });
}

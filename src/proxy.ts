import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

// Guard the pages and APIs so the gate can't be bypassed by calling the API
// directly. Runs at the edge (Cloudflare Workers) — uses only Web Crypto and the
// signed cookie payload, so no database round-trip happens here.
export const config = {
  matcher: [
    "/generate/:path*",
    "/api/generate/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const isApi = pathname.startsWith("/api/");
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const session = await verifySession(process.env.AUTH_SECRET, token);

  if (!session) {
    if (isApi) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdmin && session.role !== "admin") {
    if (isApi) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.redirect(new URL("/generate", req.url));
  }

  return NextResponse.next();
}

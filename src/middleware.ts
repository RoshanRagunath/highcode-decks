import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

// Guard both the page and the API so the gate can't be bypassed by calling the
// API directly. Runs at the edge (Cloudflare Workers) — uses only Web Crypto.
export const config = {
  matcher: ["/generate/:path*", "/api/generate/:path*"],
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const valid = await verifySession(process.env.AUTH_SECRET, token);
  if (valid) return NextResponse.next();

  // API requests get a clean JSON 401 instead of an HTML redirect.
  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

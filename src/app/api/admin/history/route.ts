import { getSession } from "@/lib/session";
import { listGenerations } from "@/lib/history";

async function requireAdmin(): Promise<Response | null> {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const generations = await listGenerations();
  return Response.json({ generations });
}

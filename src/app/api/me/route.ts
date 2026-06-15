import { getSession } from "@/lib/session";
import { findById } from "@/lib/users";

// Returns the caller's own identity for the UI (name + role). Returns null when
// not signed in — it only ever exposes the caller's own session.
export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ user: null });

  const user = await findById(session.uid);
  if (!user) return Response.json({ user: null });

  return Response.json({
    user: { name: user.name, role: user.role },
  });
}

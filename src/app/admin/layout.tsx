import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Admin-only gate. Signed-out users go to login; non-admins are bounced to the
// generator. API routes under /api/admin additionally re-check the admin role.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?from=/admin");
  if (session.role !== "admin") redirect("/generate");
  return <>{children}</>;
}

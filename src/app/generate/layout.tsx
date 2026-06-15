import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

// Gate the generator pages server-side (OpenNext/Workers runs this in the Node
// wrapper). Next 16 middleware/"proxy" can't run on the edge, so route-level
// guards replace it. API routes under /api/generate self-protect in their handlers.
export default async function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login?from=/generate");
  return <>{children}</>;
}

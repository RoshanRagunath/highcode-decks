import { redirect } from "next/navigation";

// This is an app, not a marketing site: send visitors straight to the generator.
// The proxy guards /generate, so signed-out users are redirected to /login.
export default function Home() {
  redirect("/generate");
}

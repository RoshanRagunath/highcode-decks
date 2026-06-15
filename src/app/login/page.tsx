"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Only allow same-origin relative paths as a redirect target, to avoid an
// open-redirect via a crafted ?from= value.
function safeFrom(from: string | null): string {
  if (from && from.startsWith("/") && !from.startsWith("//")) return from;
  return "/generate";
}

function LoginForm() {
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Login failed. Please try again.");
        setLoading(false);
        return;
      }
      // Hard navigation so the server-rendered, session-gated target reliably
      // picks up the freshly set cookie (a soft router.push can race the gate).
      window.location.href = safeFrom(searchParams.get("from"));
      return;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-sm border-slate-200">
      <CardContent className="pt-6">
        <div className="mb-6 flex flex-col items-center text-center space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Decks</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight pt-1">
            Sign in
          </h1>
          <p className="text-slate-500 text-sm">
            Sign in with your account to start building presentations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-sm font-medium">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading || !username || !password}>
            {loading ? "Checking…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex flex-col items-center justify-center px-4 gap-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
      <p className="text-xs text-slate-400">A Highcode app · powered by Gamma</p>
    </div>
  );
}

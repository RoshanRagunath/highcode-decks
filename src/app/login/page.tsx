"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
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
  const router = useRouter();
  const searchParams = useSearchParams();
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
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Login failed. Please try again.");
        setLoading(false);
        return;
      }
      router.push(safeFrom(searchParams.get("from")));
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm shadow-sm border-slate-200">
      <CardContent className="pt-6">
        <div className="mb-6 flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Enter access password
          </h1>
          <p className="text-slate-500 text-sm">
            Presento is invite-only. Enter the shared password to generate presentations.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              autoFocus
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

          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? "Checking…" : "Continue"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 flex items-center justify-center px-4">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

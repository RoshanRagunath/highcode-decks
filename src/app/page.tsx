"use client";

import { useRef, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

type State =
  | { phase: "idle" }
  | { phase: "loading"; abort: AbortController }
  | { phase: "result"; url: string }
  | { phase: "error"; message: string };

export default function Home() {
  const [tab, setTab] = useState<"file" | "prompt">("file");
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    if (state.phase === "loading") state.abort.abort();
    setState({ phase: "idle" });
    setPrompt("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const file = fileRef.current?.files?.[0] ?? null;

    if (tab === "file" && !file) {
      setState({ phase: "error", message: "Please select a file to upload." });
      return;
    }
    if (tab === "prompt" && !prompt.trim()) {
      setState({ phase: "error", message: "Please enter a prompt." });
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setState({
        phase: "error",
        message: "File exceeds the 4 MB limit. Please choose a smaller file.",
      });
      return;
    }

    const controller = new AbortController();
    setState({ phase: "loading", abort: controller });

    const body = new FormData();
    if (tab === "file" && file) body.append("file", file);
    if (tab === "prompt") body.append("prompt", prompt.trim());

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body,
        signal: controller.signal,
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setState({
          phase: "error",
          message: data.error ?? "Something went wrong. Please try again.",
        });
        return;
      }
      setState({ phase: "result", url: data.url });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setState({ phase: "idle" });
        return;
      }
      setState({
        phase: "error",
        message: "Network error. Please check your connection and try again.",
      });
    }
  }

  const isLoading = state.phase === "loading";

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Gamma Presentation Generator
          </h1>
          <p className="text-slate-500 text-sm">
            Upload a document or describe what you need — we&apos;ll build the
            presentation.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              Create presentation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Tabs
                value={tab}
                onValueChange={(v) => setTab(v as "file" | "prompt")}
                className="flex-col"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="file" className="flex-1">
                    Upload file
                  </TabsTrigger>
                  <TabsTrigger value="prompt" className="flex-1">
                    Write prompt
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-2 mt-4">
                  <Label htmlFor="file">
                    Document{" "}
                    <span className="text-slate-400 font-normal">
                      (PDF, DOCX, TXT, MD — max 4 MB)
                    </span>
                  </Label>
                  <Input
                    id="file"
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md"
                    disabled={isLoading}
                    className="cursor-pointer"
                  />
                </TabsContent>

                <TabsContent value="prompt" className="space-y-2 mt-4">
                  <Label htmlFor="prompt">Prompt</Label>
                  <Textarea
                    id="prompt"
                    placeholder="e.g. Create a 10-slide pitch deck for a SaaS product that helps teams track OKRs…"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    disabled={isLoading}
                    rows={5}
                  />
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Spinner />
                      Generating…
                    </span>
                  ) : (
                    "Generate presentation"
                  )}
                </Button>
                {isLoading && (
                  <Button type="button" variant="outline" onClick={reset}>
                    Cancel
                  </Button>
                )}
              </div>

              {isLoading && (
                <p className="text-center text-xs text-slate-400">
                  This may take up to a minute — hang tight.
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        {state.phase === "result" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 space-y-3">
              <p className="text-sm font-medium text-green-800">
                Your presentation is ready!
              </p>
              <a
                href={state.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Open presentation ↗
                </Button>
              </a>
              <Button
                variant="ghost"
                className="w-full text-slate-500"
                onClick={reset}
              >
                Generate another
              </Button>
            </CardContent>
          </Card>
        )}

        {state.phase === "error" && (
          <Alert variant="destructive">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        )}
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

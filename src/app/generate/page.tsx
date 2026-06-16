"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Sparkles, LogOut, Settings, Layers } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const MAX_FILE_BYTES = 4 * 1024 * 1024;

type State =
  | { phase: "idle" }
  | { phase: "loading"; abort: AbortController }
  | { phase: "result"; blobUrl: string; fileName: string }
  | { phase: "error"; message: string };

export default function GeneratePage() {
  const [tab, setTab] = useState<"file" | "prompt">("prompt");
  const [prompt, setPrompt] = useState("");
  const [state, setState] = useState<State>({ phase: "idle" });
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [me, setMe] = useState<{ name: string; role: "admin" | "user" } | null>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => res.json() as Promise<{ user: { name: string; role: "admin" | "user" } | null }>)
      .then((data) => setMe(data.user))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" }).catch(() => {});
    router.push("/login");
    router.refresh();
  }

  function reset() {
    if (state.phase === "loading") state.abort.abort();
    if (state.phase === "result") URL.revokeObjectURL(state.blobUrl);
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
      setState({ phase: "error", message: "File exceeds the 4 MB limit. Please choose a smaller file." });
      return;
    }

    const controller = new AbortController();
    setState({ phase: "loading", abort: controller });

    const body = new FormData();
    if (tab === "file" && file) body.append("file", file);
    if (tab === "prompt") body.append("prompt", prompt.trim());

    try {
      const res = await fetch("/api/generate", { method: "POST", body, signal: controller.signal });
      if (res.status === 401) {
        setState({ phase: "error", message: "Your session has expired. Redirecting to login…" });
        router.push("/login?from=/generate");
        return;
      }
      if (!res.ok) {
        // Gateway / timeout statuses come back as HTML (not our JSON), and the
        // generation may still have run long. Give an accurate, retryable message.
        if ([502, 503, 504, 522, 524].includes(res.status)) {
          setState({
            phase: "error",
            message:
              "The presentation took too long to come back (this can happen on big or busy generations). It may still finish in the background. Please try again.",
          });
          return;
        }
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setState({ phase: "error", message: data.error ?? "Something went wrong. Please try again." });
        return;
      }
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const fileNameMatch = disposition.match(/filename="([^"]+)"/);
      const fileName = fileNameMatch?.[1] ?? "presentation.pptx";
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setState({ phase: "result", blobUrl, fileName });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") { setState({ phase: "idle" }); return; }
      setState({
        phase: "error",
        message:
          "The connection dropped before the presentation finished (generation can take up to ~2 minutes). It may still complete in the background. Please try again in a moment.",
      });
    }
  }

  const isLoading = state.phase === "loading";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
      {/* Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Decks</span>
          </div>
          <div className="flex items-center gap-2">
            {me && (
              <span className="text-xs text-slate-500 hidden sm:inline">{me.name}</span>
            )}
            {me?.role === "admin" && (
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <Settings className="h-3.5 w-3.5" />
                  Admin
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="sm" className="gap-1.5" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {state.phase !== "result" ? (
          <>
            {/* Page heading */}
            <div className="mb-8 space-y-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Create your presentation
              </h1>
              <p className="text-slate-500 text-sm">
                Write a prompt or upload a document. We&apos;ll generate a full Gamma presentation in under a minute.
              </p>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-3 mb-6">
              {[
                { n: 1, label: "Choose input", active: true },
                { n: 2, label: "Generate", active: isLoading },
                { n: 3, label: "Get your link", active: false },
              ].map((step, i, arr) => (
                <div key={step.n} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                      step.active ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-400"
                    }`}>
                      {step.n}
                    </div>
                    <span className={`text-xs font-medium ${step.active ? "text-slate-700" : "text-slate-400"}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < arr.length - 1 && <div className="h-px w-6 bg-slate-200" />}
                </div>
              ))}
            </div>

            <Card className="shadow-sm border-slate-200">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <Tabs value={tab} onValueChange={(v) => setTab(v as "file" | "prompt")} className="flex-col">
                    <TabsList className="w-full">
                      <TabsTrigger value="prompt" className="flex-1 gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Write a prompt
                      </TabsTrigger>
                      <TabsTrigger value="file" className="flex-1 gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Upload a file
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="prompt" className="space-y-3 mt-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="prompt" className="text-sm font-medium">
                          Describe your presentation
                        </Label>
                        <p className="text-xs text-slate-400">
                          Be specific about the topic, audience, tone and number of slides.
                        </p>
                      </div>
                      <Textarea
                        id="prompt"
                        placeholder="e.g. Create a 10-slide investor pitch deck for a B2B SaaS that helps teams track OKRs. Audience is Series A VCs. Include market size, product overview, traction and ask."
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isLoading}
                        rows={6}
                        className="resize-none text-sm"
                      />
                      <p className="text-xs text-slate-400 text-right">{prompt.length} chars</p>
                    </TabsContent>

                    <TabsContent value="file" className="space-y-3 mt-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="file" className="text-sm font-medium">
                          Upload your document
                        </Label>
                        <p className="text-xs text-slate-400">
                          PDF, DOCX, TXT or MD, max 4 MB. We&apos;ll turn it into a full presentation.
                        </p>
                      </div>
                      <Input
                        id="file"
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        disabled={isLoading}
                        className="cursor-pointer text-sm"
                      />
                    </TabsContent>
                  </Tabs>

                  <div className="pt-1 space-y-3">
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <Spinner />
                            Generating presentation…
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="h-4 w-4" />
                            Generate presentation
                          </span>
                        )}
                      </Button>
                      {isLoading && (
                        <Button type="button" variant="outline" onClick={reset} className="shrink-0">
                          Cancel
                        </Button>
                      )}
                    </div>
                    {isLoading && (
                      <div className="flex items-center gap-2 justify-center">
                        <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-400 rounded-full animate-pulse w-2/3" />
                        </div>
                        <p className="text-xs text-slate-400 shrink-0">This may take up to a minute</p>
                      </div>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {state.phase === "error" && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{state.message}</AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          /* Result state */
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 mx-auto">
                <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Your presentation is ready!</h1>
              <p className="text-slate-500 text-sm">Click below to open it in Gamma. The link is shareable.</p>
            </div>

            <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-emerald-200">
                  <div className="h-8 w-8 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{state.fileName}</p>
                    <p className="text-xs text-slate-400">Downloaded · click to save again</p>
                  </div>
                </div>
                <a href={state.blobUrl} download={state.fileName} className="block">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download again
                  </Button>
                </a>
                <Button variant="outline" className="w-full" onClick={reset}>
                  Generate another presentation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

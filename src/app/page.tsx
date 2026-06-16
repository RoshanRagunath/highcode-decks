import Link from "next/link";
import { ArrowRight, FileText, Layers, LogIn, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Public landing page for Decks. The app itself (/generate) is gated behind login
// by its layout; this page is open to everyone.
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-lg tracking-tight">Decks</span>
            <span className="text-slate-300">·</span>
            <span className="text-sm text-slate-400">Highcode</span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm" className="gap-1.5">
              <LogIn className="h-3.5 w-3.5" />
              Sign in
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white pt-20 pb-24">
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="pointer-events-none absolute top-10 right-0 w-96 h-96 rounded-full bg-violet-100/40 blur-3xl" />

          <div className="relative max-w-3xl mx-auto px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Powered by Gamma
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] md:text-6xl">
              On-brand decks,{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                generated in a minute
              </span>
            </h1>

            <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
              Upload a document or describe your idea. Decks turns it into a polished Gamma
              presentation using your team&apos;s theme. Built by Highcode.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/generate">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 gap-2 h-12 text-base">
                  <Sparkles className="h-4 w-4" />
                  Open Decks
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 gap-2 h-12 text-base">
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <p className="text-xs text-slate-400">Invite-only · ask a Highcode admin for access</p>
          </div>
        </section>

        {/* ── Features ────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center space-y-3 mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Why Decks</p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Your content, your theme, no busywork
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <FileText className="h-5 w-5 text-indigo-600" />,
                  bg: "bg-indigo-50",
                  title: "Bring your content",
                  description:
                    "Upload a PDF, Word doc, text or Markdown file. Or just type a prompt. Decks structures it into slides.",
                },
                {
                  icon: <Wand2 className="h-5 w-5 text-violet-600" />,
                  bg: "bg-violet-50",
                  title: "Your assigned theme",
                  description:
                    "Every account is linked to a Gamma theme, so each generated deck comes out on-brand automatically.",
                },
                {
                  icon: <Sparkles className="h-5 w-5 text-emerald-600" />,
                  bg: "bg-emerald-50",
                  title: "Ready in under a minute",
                  description:
                    "Generate and download a finished presentation, then refine it in Gamma whenever you like.",
                },
              ].map((f) => (
                <Card key={f.title} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 space-y-3">
                    <div className={`inline-flex h-10 w-10 rounded-xl items-center justify-center ${f.bg}`}>
                      {f.icon}
                    </div>
                    <h3 className="font-semibold text-slate-900">{f.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────── */}
        <section className="py-24 bg-gradient-to-br from-indigo-600 to-violet-700">
          <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-tight">Ready to build a deck?</h2>
            <p className="text-indigo-200 text-lg">Sign in with your Decks account to get started.</p>
            <Link href="/generate">
              <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 px-10 gap-2 h-12 text-base font-semibold">
                <Sparkles className="h-4 w-4" />
                Open Decks
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 rounded bg-indigo-600 flex items-center justify-center">
              <Layers className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Decks</span>
            <span className="text-xs text-slate-400">· a Highcode app</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Presentations powered by{" "}
            <a href="https://gamma.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-600">
              Gamma
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, FileText, Link2, Sparkles, Upload, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* ── Nav ─────────────────────────────────────── */}
      <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-lg tracking-tight">Presento</span>
          </div>
          <Link href="/generate">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
              Try it free <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ── Hero ────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-white to-white pt-20 pb-24">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-indigo-100/50 blur-3xl" />
          <div className="pointer-events-none absolute top-10 right-0 w-96 h-96 rounded-full bg-violet-100/40 blur-3xl" />

          <div className="relative max-w-3xl mx-auto px-4 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
              <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Powered by Gamma AI
            </div>

            <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.1] md:text-6xl">
              Turn any idea into a{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
                stunning presentation
              </span>
            </h1>

            <p className="text-xl text-slate-500 max-w-xl mx-auto leading-relaxed">
              Upload a document or describe your vision in plain text. Presento generates a beautiful,
              shareable Gamma presentation in under a minute.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/generate">
                <Button
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 gap-2 h-12 text-base"
                >
                  <Sparkles className="h-4 w-4" />
                  Create a presentation
                </Button>
              </Link>
            </div>

            {/* Social proof hint */}
            <p className="text-xs text-slate-400">No account required · Results in under 60 seconds</p>
          </div>

          {/* Mock UI preview */}
          <div className="relative max-w-2xl mx-auto mt-16 px-4">
            <div className="rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/60 bg-white overflow-hidden">
              {/* Browser chrome */}
              <div className="h-10 bg-slate-50 border-b border-slate-100 flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                  <div className="h-3 w-3 rounded-full bg-slate-200" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="h-5 rounded-md bg-slate-100 w-48 mx-auto" />
                </div>
              </div>
              {/* App preview skeleton */}
              <div className="p-6 space-y-4 bg-gradient-to-br from-slate-50 to-indigo-50/20">
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-9 bg-indigo-100 rounded-lg border border-indigo-200 flex items-center justify-center">
                    <span className="text-xs text-indigo-500 font-medium">✦ Write a prompt</span>
                  </div>
                  <div className="h-9 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                    <span className="text-xs text-slate-400 font-medium">↑ Upload a file</span>
                  </div>
                </div>
                <div className="h-24 bg-white rounded-lg border border-slate-200 p-3">
                  <div className="space-y-1.5">
                    <div className="h-2.5 bg-slate-100 rounded w-full" />
                    <div className="h-2.5 bg-slate-100 rounded w-5/6" />
                    <div className="h-2.5 bg-slate-100 rounded w-4/6" />
                  </div>
                </div>
                <div className="h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-white font-medium">✦ Generate presentation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────── */}
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center space-y-3 mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                Why Presento
              </p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Everything you need to present better
              </h2>
              <p className="text-slate-500 max-w-md mx-auto">
                No design skills required. No template hunting. Just your content — transformed into slides.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Upload className="h-5 w-5 text-indigo-600" />,
                  bg: "bg-indigo-50",
                  title: "Upload anything",
                  description:
                    "PDF, Word doc, plain text, or Markdown — upload your existing content and we'll turn it into a polished deck.",
                },
                {
                  icon: <Sparkles className="h-5 w-5 text-violet-600" />,
                  bg: "bg-violet-50",
                  title: "Or just describe it",
                  description:
                    "No file? No problem. Type your idea in plain English and our AI generates a complete, structured presentation.",
                },
                {
                  icon: <Link2 className="h-5 w-5 text-emerald-600" />,
                  bg: "bg-emerald-50",
                  title: "Instant shareable link",
                  description:
                    "Every presentation is hosted on Gamma and ready to share. Send a link, embed it, or export — all from Gamma.",
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

        {/* ── How it works ────────────────────────────── */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center space-y-3 mb-14">
              <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
                How it works
              </p>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                Three steps to a finished deck
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: <FileText className="h-6 w-6 text-indigo-600" />,
                  title: "Choose your input",
                  description:
                    "Upload a PDF, Word doc, or text file — or just type a prompt describing the presentation you want to create.",
                },
                {
                  step: "02",
                  icon: <Zap className="h-6 w-6 text-violet-600" />,
                  title: "We build the slides",
                  description:
                    "Our workflow processes your content and instructs Gamma's AI to generate a complete, structured presentation.",
                },
                {
                  step: "03",
                  icon: <Link2 className="h-6 w-6 text-emerald-600" />,
                  title: "Open and share",
                  description:
                    "Get a live Gamma link in under a minute. Open it, make tweaks in Gamma's editor, and share with anyone.",
                },
              ].map((s) => (
                <div key={s.step} className="relative space-y-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-black text-slate-100 select-none">{s.step}</span>
                    <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center">
                      {s.icon}
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-lg">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ─────────────────────────────────────── */}
        <section className="py-24 bg-gradient-to-br from-indigo-600 to-violet-700">
          <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
            <h2 className="text-3xl font-bold text-white tracking-tight">
              Ready to create your first presentation?
            </h2>
            <p className="text-indigo-200 text-lg">
              No sign-up. No credit card. Just your idea and a beautiful deck in minutes.
            </p>
            <Link href="/generate">
              <Button
                size="lg"
                className="bg-white text-indigo-700 hover:bg-indigo-50 px-10 gap-2 h-12 text-base font-semibold"
              >
                <Sparkles className="h-4 w-4" />
                Start generating
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
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-slate-700">Presento</span>
          </div>
          <p className="text-xs text-slate-400 text-center">
            Presentations powered by{" "}
            <a href="https://gamma.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-slate-600">
              Gamma
            </a>
            {" "}· Built with Next.js + Cloudflare Workers
          </p>
        </div>
      </footer>
    </div>
  );
}

# gamma-generator

> Per-app Claude Code context.

## Purpose

Public web app that lets anyone upload a document (PDF, DOCX, TXT, MD) or write a text prompt to generate a Gamma presentation. The actual generation logic lives in an existing n8n workflow. This app is a polished front-end + thin Next.js API proxy that hides the webhook URL and adds server-side validation.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Flexible, Tailwind built-in, easy API routes |
| UI | shadcn/ui + Tailwind v4 | Polished baseline, full ownership of component code |
| Auth | Shared-password gate | Signed httpOnly cookie verified in middleware; no per-user accounts needed |
| Backend / DB | None — single API route proxies to n8n | No persistence needed |
| Deploy | Cloudflare Workers via OpenNext | Personal Cloudflare account, subdomain on highcode.nl |

Toolkit references consulted: `toolkits/fullstack/nextjs.md`, `toolkits/ui/shadcn-ui.md`, `toolkits/deploy/cloudflare.md`

## Owning org

**Personal** — personal GitHub account, personal Cloudflare account (owns highcode.nl), no Fizor billing.

## Run commands

```
pnpm dev          # local dev server (Next.js, port 3000)
pnpm build        # Next.js production build
pnpm start        # run production build locally
pnpm lint         # ESLint
pnpm preview      # OpenNext Workers local preview (requires .dev.vars)
pnpm deploy       # OpenNext build + deploy to Cloudflare Workers
```

## Env vars

See `.env.example` for the full list. For local dev copy `.env.example` → `.env.local`.
For Cloudflare Workers preview copy to `.dev.vars`. For production use `wrangler secret put`.

- `N8N_WEBHOOK_URL` — full URL of the n8n webhook that handles generation. Server-side only (never `NEXT_PUBLIC_`).
- `ACCESS_PASSWORD` — shared password users enter on `/login` to access `/generate`. Server-side only.
- `AUTH_SECRET` — random 32+ byte secret used to sign session cookies (HMAC-SHA256). Generate with `openssl rand -base64 32`. Server-side only.

## Deploy

- **Production:** custom subdomain on highcode.nl (e.g. `gamma.highcode.nl`) — confirm subdomain with Roshan before wiring
- **Workers URL:** `gamma-generator.<account>.workers.dev` (set during first deploy)
- **Command:** `pnpm deploy` (runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`)
- **First deploy:** run `pnpm dlx wrangler login` first, verify account with `wrangler whoami`

## Architecture notes

- Access gate: `src/middleware.ts` guards `/generate` and `/api/generate`. A valid signed
  `gg_session` httpOnly cookie is required; otherwise page requests redirect to `/login` and
  API requests get a `401`. The cookie is set by `/api/login` (checks `ACCESS_PASSWORD`,
  signs with `AUTH_SECRET`) and cleared by `/api/logout`. Sign/verify logic lives in
  `src/lib/auth.ts` using Web Crypto (`crypto.subtle`) so it runs at the edge / on Workers.
- Single API route at `/api/generate` accepts `multipart/form-data` with a `file` (File) and/or `prompt` (string) field.
- Server validates MIME type and file size before forwarding to n8n.
- n8n is expected to return `{ url: string }` JSON. If the shape differs, update the destructuring in `src/app/api/generate/route.ts`.
- `maxDuration = 120` gives headroom for slow n8n runs. Cloudflare Workers Paid plan recommended ($5/mo).
- No rate-limiting in MVP. If abuse occurs, add a shared-secret query param or Cloudflare WAF rule.

## Constraints / quirks

- `.npmrc` has `ignore-scripts=true` to avoid pnpm v11 build-approval prompts for `sharp` and `unrs-resolver`. These native modules are not needed for this app.
- OpenNext generates `wrangler.jsonc` and `open-next.config.ts` — commit both.
- Keep `.dev.vars` and `.env.local` out of git (already in `.gitignore`).
- n8n response shape assumed to be `{ url: string }`. Verify against the real workflow before production.

## Workflow

- Branch from `main`; PRs preview via Cloudflare Workers preview URLs.
- Run `pnpm lint` and `pnpm build` before opening a PR.
- Never commit `.env.local`, `.dev.vars`, `.wrangler/`, `.open-next/`.
- Update `.env.example` when adding new env vars.
- For new features, follow the quality bar in workspace `../../CLAUDE.md`.

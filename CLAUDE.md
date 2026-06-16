# gamma-generator

> Per-app Claude Code context.

## Purpose

**Decks** (user-facing product name; a Highcode app) — an invite-only web app where signed-in users upload a document (PDF, DOCX, TXT, MD) or write a text prompt to generate a Gamma presentation using the Gamma theme assigned to their account. The actual generation logic lives in an existing n8n workflow. This app is a polished front-end + thin Next.js API proxy that hides the webhook URL, adds per-user accounts, and adds server-side validation.

> Branding note: the user-facing name is **Decks**, but the repo, Cloudflare Worker, and domain keep the original `gamma-generator` / `gamma.highcode.nl` names.

## Copy style

All **user-facing copy** (page text, button/label text, placeholders, and API error
messages returned to the browser) must follow these rules:

- **No em-dashes (`—`) or en-dashes (`–`).** Rewrite as two sentences, or use a comma,
  colon, or parentheses. Example: "in the background — please try again" → "in the
  background. Please try again."
- **No Oxford / serial comma.** Drop the comma before the final `and`/`or` in a list of
  three or more. Example: "PDF, DOCX, TXT, or MD" → "PDF, DOCX, TXT or MD".
- **Avoid the comma-before-conjunction join** ("…, and we'll generate"). Prefer two short
  sentences instead ("… . We'll generate …").
- Use `·` (middle dot) as the separator in titles/footers, not a dash — e.g. the page
  `<title>` is "Decks · Highcode".

These apply only to copy users read. Internal code comments are exempt. The box-drawing
separators (`──`) in JSX comments are not dashes and can stay.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 App Router | Flexible, Tailwind built-in, easy API routes |
| UI | shadcn/ui + Tailwind v4 | Polished baseline, full ownership of component code |
| Auth | Per-user accounts (username + password) | PBKDF2-hashed passwords; signed httpOnly cookie carries `{ uid, role }`; verified in proxy/middleware |
| Backend / DB | Cloudflare D1 (`users` table) + API route proxy to n8n | Per-user accounts + each user's Gamma `themeId` |
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
- `AUTH_SECRET` — random 32+ byte secret used to sign session cookies (HMAC-SHA256). Generate with `openssl rand -base64 32`. Server-side only.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` — bootstrap admin. The first admin account is seeded from these on first login if no admin exists. Server-side only.

D1 binding: `DB` (database `gamma-generator-db`) — declared in `wrangler.jsonc`. Run
`pnpm cf-typegen` after changing bindings to regenerate `cloudflare-env.d.ts`.

## Deploy

- **Production:** custom subdomain on highcode.nl (e.g. `gamma.highcode.nl`) — confirm subdomain with Roshan before wiring
- **Workers URL:** `gamma-generator.<account>.workers.dev` (set during first deploy)
- **Command:** `pnpm deploy` (runs `opennextjs-cloudflare build && opennextjs-cloudflare deploy`)
- **First deploy:** run `pnpm dlx wrangler login` first, verify account with `wrangler whoami`

## Architecture notes

- Access gate: enforced per-route, NOT via middleware. Next 16's middleware/"proxy" runs only
  on the Node runtime, which OpenNext Cloudflare doesn't support — so there is no `proxy.ts`.
  Instead:
  - Page gates are server-component layouts: `src/app/generate/layout.tsx` (requires a session)
    and `src/app/admin/layout.tsx` (requires `role === "admin"`). They call `getSession()` and
    `redirect()` on failure.
  - API routes self-protect in their handlers (`/api/generate` and `/api/me` call `getSession()`;
    `/api/admin/*` call `requireAdmin()`).
  The signed `gg_session` cookie carries `{ uid, role }`, verified with `AUTH_SECRET`.
- Auth primitives in `src/lib/auth.ts` (Web Crypto, edge-safe): session sign/verify (HMAC) +
  PBKDF2 password hashing. `src/lib/session.ts` reads the current session in route handlers.
- Users and groups live in D1, accessed only through `src/lib/users.ts` (the one SQL file;
  binding `DB` via `getCloudflareContext()`). `ensureSeeded()` creates the first admin from
  `ADMIN_USERNAME`/`ADMIN_PASSWORD`. Schema in `migrations/0001_init.sql` (`users`) and
  `migrations/0002_groups.sql` (`groups` table + `users.group_id`).
- **Themes — groups + per-user override.** A `groups` row carries a shared `theme_id`; a user
  may belong to one group (`users.group_id`, nullable). The user's own `theme_id` is an
  optional override. Effective theme = `user.themeId ?? group.themeId`, computed by
  `resolveThemeId(user)` in `src/lib/users.ts`. D1 doesn't enforce FKs, so `deleteGroup()`
  nulls members' `group_id` before dropping the group (no orphaned references).
- Admin UI at `/admin` manages both groups and users (CRUD via `/api/admin/groups[/:id]` and
  `/api/admin/users[/:id]`); each handler re-checks admin role. The users list shows each
  user's group, override, and resolved effective theme.
- `/api/generate` looks up the logged-in user and calls `resolveThemeId(user)` to get the
  effective theme, then injects it into the n8n payload (JSON `themeId` field, or
  `form.append("themeId", …)` for file uploads), so admin theme/group changes apply on the
  next generation and deleted users fail closed (`401`).
- Single API route at `/api/generate` accepts `multipart/form-data` with a `file` (File) and/or `prompt` (string) field.
- Server validates MIME type and file size before forwarding to n8n.
- n8n returns `{ fileBase64 | fileData, fileName?, mimeType? }`; if the shape differs, update the destructuring in `src/app/api/generate/route.ts`.
- `maxDuration = 120` gives headroom for slow n8n runs. Cloudflare Workers Paid plan recommended ($5/mo).
- No rate-limiting in MVP. If abuse occurs, add a shared-secret query param or Cloudflare WAF rule.

## Constraints / quirks

- `.npmrc` has `ignore-scripts=true` to avoid pnpm v11 build-approval prompts for `sharp` and `unrs-resolver`. These native modules are not needed for this app.
- OpenNext generates `wrangler.jsonc` and `open-next.config.ts` — commit both.
- Keep `.dev.vars` and `.env.local` out of git (already in `.gitignore`).
- n8n returns `{ fileBase64 | fileData, fileName?, mimeType? }`; `/api/generate` decodes it to a binary download. Verified live (returns a real `.pptx`).

### Deploy gotchas (Next 16 + OpenNext on Cloudflare) — all already handled in-repo

- **Build must use Webpack, not Turbopack.** Next 16's `next build` defaults to Turbopack, whose chunks fail at runtime on Workers (`ChunkLoadError`). The `build` script is `next build --webpack`. Do not remove `--webpack`. (`next dev` still uses Turbopack — fine.)
- **`NEXT_PRIVATE_MINIMAL_MODE=1`** is set in `wrangler.jsonc` `vars`. Without it the worker 500s with `Dynamic require of ".../middleware-manifest.json" is not supported`. Safe because there is no Next middleware (auth is in layouts/handlers). See opennextjs-cloudflare #1232.
- **No Next middleware/`proxy.ts`.** Next 16 proxy is Node-runtime-only and OpenNext doesn't support it — gating lives in route layouts + handlers instead.
- **Windows symlink permission:** `pnpm deploy`'s OpenNext bundling needs symlink rights — enable Windows **Developer Mode** (or run elevated), else `EPERM: symlink`.
- **Deploy = `pnpm deploy`** (`opennextjs-cloudflare build` runs `pnpm build` → webpack). Live at `https://gamma-generator.roshan-58.workers.dev` (custom domain `gamma.highcode.nl` wired separately in the CF dashboard).

## Workflow

- Branch from `main`; PRs preview via Cloudflare Workers preview URLs.
- Run `pnpm lint` and `pnpm build` before opening a PR.
- Never commit `.env.local`, `.dev.vars`, `.wrangler/`, `.open-next/`.
- Update `.env.example` when adding new env vars.
- For new features, follow the quality bar in workspace `../../CLAUDE.md`.

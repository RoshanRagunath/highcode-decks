# Gamma Presentation Generator

Upload a document (PDF, DOCX, TXT, MD) or write a prompt to generate a Gamma presentation. The generation logic is handled by an n8n workflow; this app is the front-end + API proxy.

## Prerequisites

- Node.js 18+
- pnpm 11+
- n8n webhook URL for Gamma generation

## Setup

```bash
cp .env.example .env.local
# Fill in N8N_WEBHOOK_URL, AUTH_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD in .env.local
# Generate a secret: openssl rand -base64 32
pnpm install

# Create the D1 database and apply the schema locally:
pnpm dlx wrangler d1 create gamma-generator-db   # paste the id into wrangler.jsonc
pnpm dlx wrangler d1 migrations apply gamma-generator-db --local
```

## Access & users

`/generate`, `/api/generate`, and `/admin` are protected. Visitors are redirected to
`/login` and sign in with a **per-user account** (username + password). A successful login
sets a signed httpOnly session cookie (valid 7 days) carrying the user id and role.

- **Users** live in a Cloudflare **D1** database (`users` table), managed only via
  `src/lib/users.ts`.
- Each user is assigned a Gamma **`themeId`**; on generate, the API injects it into the n8n
  payload so the deck uses that user's theme.
- The first **admin** is seeded from `ADMIN_USERNAME` / `ADMIN_PASSWORD` on first login.
  Admins manage accounts at **`/admin`** (create users, set theme IDs, reset passwords, delete).

## Run commands

```bash
pnpm dev        # dev server at http://localhost:3000
pnpm build      # production build
pnpm start      # run production build locally
pnpm lint       # ESLint
pnpm preview    # Cloudflare Workers local preview (needs .dev.vars)
pnpm deploy     # deploy to Cloudflare Workers
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `N8N_WEBHOOK_URL` | Yes | Full URL of the n8n webhook — server-side only |
| `AUTH_SECRET` | Yes | Random secret signing session cookies (`openssl rand -base64 32`) — server-side only |
| `ADMIN_USERNAME` | Yes | Bootstrap admin username — server-side only |
| `ADMIN_PASSWORD` | Yes | Bootstrap admin password — server-side only |

Plus the `DB` D1 binding (in `wrangler.jsonc`, not an env var).

For local dev: `.env.local`  
For Cloudflare Workers preview: `.dev.vars`  
For production: set each secret with `pnpm dlx wrangler secret put <NAME>`
(`N8N_WEBHOOK_URL`, `AUTH_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`)

## Deploy (Cloudflare Workers)

```bash
pnpm dlx wrangler login          # authenticate (personal account)
wrangler whoami                  # verify correct account

# D1: create once, paste the id into wrangler.jsonc, then apply migrations remotely
pnpm dlx wrangler d1 create gamma-generator-db
pnpm dlx wrangler d1 migrations apply gamma-generator-db --remote

# Secrets
pnpm dlx wrangler secret put N8N_WEBHOOK_URL
pnpm dlx wrangler secret put AUTH_SECRET
pnpm dlx wrangler secret put ADMIN_USERNAME
pnpm dlx wrangler secret put ADMIN_PASSWORD

pnpm deploy                      # build + deploy
```

Add a custom domain in the Cloudflare dashboard after first deploy:  
Workers & Pages → gamma-generator → Settings → Domains & Routes → Add Custom Domain

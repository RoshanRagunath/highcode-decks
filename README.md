# Gamma Presentation Generator

Upload a document (PDF, DOCX, TXT, MD) or write a prompt to generate a Gamma presentation. The generation logic is handled by an n8n workflow; this app is the front-end + API proxy.

## Prerequisites

- Node.js 18+
- pnpm 11+
- n8n webhook URL for Gamma generation

## Setup

```bash
cp .env.example .env.local
# Fill in N8N_WEBHOOK_URL in .env.local
pnpm install
```

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

For local dev: `.env.local`  
For Cloudflare Workers preview: `.dev.vars`  
For production: `pnpm dlx wrangler secret put N8N_WEBHOOK_URL`

## Deploy (Cloudflare Workers)

```bash
pnpm dlx wrangler login          # authenticate (personal account)
wrangler whoami                  # verify correct account
pnpm dlx wrangler secret put N8N_WEBHOOK_URL
pnpm deploy                      # build + deploy
```

Add a custom domain in the Cloudflare dashboard after first deploy:  
Workers & Pages → gamma-generator → Settings → Domains & Routes → Add Custom Domain

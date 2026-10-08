# Vartu Creations — Deployment & Infrastructure Guide

## 1. Free-First Architecture Strategy

To keep operating overhead at zero during initial rollout, Vartu Creations uses free-tier hosting:

| Component | Platform | Free Tier Capability |
| :--- | :--- | :--- |
| **Web & API Host** | Vercel / Cloud Run | Generous free edge bandwidth & execution |
| **Relational Database** | Supabase PostgreSQL | 500 MB free database storage, SSL connection pool |
| **Source Control** | GitHub | Private repositories & GitHub Actions CI/CD |
| **AI Intelligence** | Google Gemini API | Free quota tier for `gemini-3.8-flash` |
| **Custom Domain** | `crm.vartucreations.com` | Free SSL via Cloudflare / Vercel DNS |

---

## 2. Environment Variables

Create `.env` using `.env.example`:

```bash
# Gemini API Key (Server-side)
GEMINI_API_KEY="AIzaSy..."

# Database URL (When connected to PostgreSQL / Supabase)
DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Application URL
APP_URL="https://crm.vartucreations.com"
PORT=3000
NODE_ENV="production"
```

---

## 3. Local Development & Build

```bash
# 1. Install dependencies
npm install

# 2. Run full-stack dev server (Vite + Express)
npm run dev

# 3. Build production bundle
npm run build

# 4. Start production Node server
npm run start
```

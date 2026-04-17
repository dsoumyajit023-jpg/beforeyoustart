# BeforeUstart

> A brutally honest AI reality check tool — powered by Claude.

Before you leap, know what you're actually jumping into. No fluff, no motivation speeches. Just reality.

---

## Tech Stack

- **Frontend** — React 18 + Vite
- **Backend** — Vercel Serverless Function (`/api/ask.js`)
- **AI** — Anthropic Claude (claude-sonnet-4)
- **Deployment** — Vercel

The API key lives **only on the server** — it is never exposed to the browser.

---

## Local Development

### 1. Clone and install

```bash
git clone https://github.com/your-username/beforeyoustart.git
cd beforeyoustart
npm install
```

### 2. Set up your API key

```bash
cp .env.example .env.local
# Edit .env.local and add your Anthropic API key
```

### 3. Run locally with Vercel CLI (recommended — tests the API route too)

```bash
npm install -g vercel
vercel dev
```

Or run just the frontend (the `/api/ask` route won't work without `vercel dev`):

```bash
npm run dev
```

---

## Deploy to Vercel

### Option A — Vercel Dashboard (easiest)

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. In **Settings → Environment Variables**, add:
   - `ANTHROPIC_API_KEY` = `sk-ant-...`
4. Click **Deploy**. Done.

### Option B — Vercel CLI

```bash
vercel
# Follow the prompts, then add the env var:
vercel env add ANTHROPIC_API_KEY
vercel --prod
```

---

## Project Structure

```
beforeyoustart/
├── src/
│   ├── main.jsx          # React entry point
│   └── App.jsx           # Full UI — all pages and components
├── api/
│   └── ask.js            # Vercel serverless function (Anthropic proxy)
├── public/
│   └── favicon.svg
├── index.html            # Vite HTML shell
├── vite.config.js
├── vercel.json           # Build + routing config
├── package.json
├── .env.example          # Copy to .env.local, add your key
└── .gitignore
```

---

## How It Works

1. User submits a question + depth level from the React UI.
2. React calls `POST /api/ask` with `{ question, depth }`.
3. The Vercel function reads `ANTHROPIC_API_KEY` from env, calls the Anthropic API, and returns structured JSON.
4. The UI renders the Reality Score, verdict, challenges, opportunities, 30-day plan, and more.

---

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key. Get one at [console.anthropic.com](https://console.anthropic.com) |

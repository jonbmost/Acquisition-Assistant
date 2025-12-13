# Deployment Guide for Acquisition Assistant

This project deploys to **Vercel** from the `main` branch. The `vercel.json` file in the repo pins the Vite build settings, SPA routing, **Node 20.19** for builds + API routes, and a reproducible `npm ci` install so production matches local behavior.

## One-time Vercel setup

1. Create a Vercel project pointing at this repository.
2. Set the environment variable `ANTHROPIC_API_KEY` in the project settings (Production + Preview).
3. Confirm the project is configured to deploy from the `main` branch with **Install Command** `npm ci`, **Build Command** `npm run build`, and **Output Directory** `dist` (declared in `vercel.json`). The repository now includes a `.nvmrc` and `package.json` `engines.node` entry so Vercel picks Node 20.19 during both build and runtime. If the dashboard shows a different Node version, set it explicitly to **20.19**.

## How to deploy

- Push to `main`. Vercel will build with `npm ci && npm run build` and publish `dist/` plus the `/api` functions.
- For a manual redeploy when Vercel appears “stuck,” run from your workstation:
  ```bash
  npm install -g vercel
  vercel pull --yes --environment=production  # ensures local config matches the project
  vercel --prod --force                       # forces a fresh production build from the current commit
  ```
- If you need to redeploy a specific commit, use the Vercel dashboard’s “Redeploy” on that commit.

## Local development

### Prerequisites
- Node.js 20.19 and npm (run `nvm use` in the repo root to auto-select the pinned Node version from `.nvmrc`)

### Setup
```bash
npm install
```

### Development server
```bash
npm run dev
```
Runs at `http://localhost:5173`.

### Build locally
```bash
npm run build
```
Outputs to `dist/` (matches Vercel).

### Preview production build
```bash
npm run preview
```

## Environment variables

Create a `.env` file in the root directory (not tracked in git):
```
ANTHROPIC_API_KEY=your_api_key_here
```

## Troubleshooting deployments

- **GitHub PR shows conflicts (e.g., README.md, DEPLOYMENT.md) and deployments fail**: pull the latest `main`, merge it locally, resolve the conflicts, and push the merged result. Conflicts stop Vercel from deploying because the PR cannot be built until it is mergeable. After resolving, trigger a fresh build with `vercel --prod --force` or via the dashboard.
- **Vercel didn’t update after a push**: check the Vercel build logs for the commit. If the build was skipped or cached, run `vercel --prod --force` from the repo root to trigger a clean build.
- **Build/install failures on Vercel**: ensure the project is using Node 20.19 (package.json `engines.node` and `.nvmrc`). Re-run a failed build from the dashboard after confirming Vercel is honoring the repo’s `npm ci` + `npm run build` commands.
- **SPA routes 404 on refresh**: the `routes` in `vercel.json` rewrite everything except `/api/*` to `index.html`, so ensure that file was built and uploaded (run `npm run build` locally to verify).
- **API runtime issues**: API functions target Node 20.19 via `vercel.json`. If you see runtime mismatches, confirm the project settings don’t override the runtime.
- **Anthropic API errors**: make sure `ANTHROPIC_API_KEY` is set in Vercel and that the model name is valid (`claude-3-5-sonnet-20240620`).

## Repository structure (high level)
```
├── api/                     # Serverless functions for chat APIs
├── knowledge-base/          # Example knowledge base docs
├── src root (*.tsx, .ts)    # React + Vite app source
├── vercel.json              # Vercel build + routing configuration
└── package.json             # Scripts and dependencies
```

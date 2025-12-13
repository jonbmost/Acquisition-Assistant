# What to Do Next

These steps help you verify the working Vercel deployment, sync it back to GitHub if needed, and confirm everything still builds locally. **This pull request does not automatically fetch the live Vercel code**—you still need to run the steps below to pull the production snapshot (e.g., from https://acquisition-assistant-bzxl6ator-agile-acq.vercel.app) and push it to GitHub if your repo is out of sync.

## 1) Verify Production Environment Variables
- In Vercel, open **Settings → Environment Variables** for `acquisition-assistant`.
- Confirm `ANTHROPIC_API_KEY` exists for the **Production** environment.
- If you update the key, trigger a redeploy so serverless functions pick it up.

## 2) Pull the Working Deployment (if GitHub is out of sync)
Use the Vercel CLI to download the exact production snapshot:
```bash
npm install -g vercel
vercel login
mkdir -p ~/vercel-download && cd ~/vercel-download
vercel pull --yes --environment=production
```
- Team: **Agile Acq**
- Project: **acquisition-assistant**

The folder should contain your project files (not just `.vercel`).

## 3) Replace Your Local Repo with the Pulled Files
From your local repo directory:
```bash
git checkout main
find . -mindepth 1 -maxdepth 1 ! -name '.git' -exec rm -rf {} +
cp -r ~/vercel-download/* .
```

## 4) Validate Locally
Run the same commands the CI uses so you know the build is healthy:
```bash
npm install
npm run build
npm run preview # optional sanity check at http://localhost:4173
```

## 5) Push to GitHub
If the build passes, replace the remote with the known-good code:
```bash
git add -A
git commit -m "Sync with working Vercel deployment"
git push origin main --force
```

## 6) Confirm Deployments
- Watch GitHub Actions for a successful run.
- Verify the live site once the action finishes.
- Keep a local copy of `~/vercel-download` as a fallback until you confirm production looks correct.

## 7) Ongoing Safety Checks
- Before future changes, create a new branch and run `npm run build` locally.
- Keep secrets only in environment variables—never commit API keys.

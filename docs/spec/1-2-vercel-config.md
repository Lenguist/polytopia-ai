# 1-2 Vercel Configuration & Environment

## Prompt

Add Vercel-ready configuration to the project. Create a `vercel.json` (or rely on framework defaults) that correctly builds the Vite app. Add any necessary environment variable placeholders (e.g. for future multiplayer or analytics). Ensure the project can be deployed to Vercel with zero extra configuration beyond connecting the GitHub repo. Include a basic `.gitignore` update if needed and a simple README section about deployment.

## Supplementary Information

- Vite projects are first-class on Vercel; usually no custom `vercel.json` is required, but document the expected build command (`vite build`) and output directory (`dist`).
- Add `"type": "module"` consistency checks.
- Prepare for later SPA routing if needed (rewrites).
- Acceptance: Pushing to a Vercel-connected repo produces a successful preview deployment of the current 3D box scene.

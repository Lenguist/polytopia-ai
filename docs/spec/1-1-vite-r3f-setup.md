# 1-1 Vite + React Three Fiber Project Setup

## Prompt

Create a new Vite + React + TypeScript project configured for React Three Fiber. Install the core dependencies (`three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/rapier`, `three-bvh-csg`, `three-mesh-bvh`). Set up a minimal working Canvas that renders a simple scene (box + ambient + directional light). Use the latest stable versions compatible with React 19. Ensure TypeScript paths and Vite config are clean.

## Supplementary Information

- Prefer `npm create vite@latest polytopia-3d -- --template react-ts`.
- Add `@types/three` if needed.
- Keep the initial `App.tsx` extremely simple so later steps can replace it cleanly.
- Do **not** add physics or CSG yet — just a working R3F canvas.
- Target modern browsers; no need for legacy polyfills.
- Acceptance: `npm run dev` shows a rotating or static 3D box without errors.

# Polytopia 3D Implementation Spec

This folder contains a structured **prompt tree** for implementing a mobile-friendly 3D version of *The Battle of Polytopia* as described in the root `README.md`.

**Target platform:** [Vercel](https://vercel.com)  
**Core stack:** Vite + React + TypeScript + React Three Fiber + three-bvh-csg + @react-three/rapier

The full machine-readable structure lives in [`prompt-tree.json`](./prompt-tree.json).

**AI opponent:** see [`ai.md`](./ai.md) — compact board/state payload, DeepSeek prompt contract, and provider matrix (OpenRouter / AI21 / Hugging Face planned).

---

## Phase 1 — Foundation

Project scaffolding, Vercel readiness, and base performance configuration for mobile browsers.

| Step | Title | Prompt File |
|------|-------|-------------|
| 1-1 | Vite + React Three Fiber Project Setup | [1-1-vite-r3f-setup.md](./1-1-vite-r3f-setup.md) |
| 1-2 | Vercel Configuration & Environment | [1-2-vercel-config.md](./1-2-vercel-config.md) |
| 1-3 | Base Mobile Performance Configuration | [1-3-base-performance.md](./1-3-base-performance.md) |

## Phase 2 — Core Game Logic

Pure TypeScript game engine independent of Three.js — state, turns, stars, technology, and pathfinding.

| Step | Title | Prompt File |
|------|-------|-------------|
| 2-1 | Game Types & Central State | [2-1-game-types-state.md](./2-1-game-types-state.md) |
| 2-2 | Turn System & Star Economy | [2-2-turns-stars.md](./2-2-turns-stars.md) |
| 2-3 | Technology Tree & Research | [2-3-tech-tree.md](./2-3-tech-tree.md) |

## Phase 3 — 3D World

React Three Fiber scene, procedural square tile grid, and terrain features using three-bvh-csg.

| Step | Title | Prompt File |
|------|-------|-------------|
| 3-1 | Canvas, Camera & Lighting | [3-1-canvas-camera.md](./3-1-canvas-camera.md) |
| 3-2 | Procedural Tile Grid with Instancing | [3-2-tile-grid.md](./3-2-tile-grid.md) |
| 3-3 | Terrain Features with three-bvh-csg | [3-3-terrain-csg.md](./3-3-terrain-csg.md) |

## Phase 4 — Units & Movement

Unit representation, Rapier physics integration, pathfinding, and smooth movement.

| Step | Title | Prompt File |
|------|-------|-------------|
| 4-1 | Unit Data Model & Instanced Rendering | [4-1-unit-instancing.md](./4-1-unit-instancing.md) |
| 4-2 | Rapier Physics Integration | [4-2-rapier-setup.md](./4-2-rapier-setup.md) |
| 4-3 | Chebyshev Pathfinding & Movement | [4-3-pathfinding-movement.md](./4-3-pathfinding-movement.md) |

## Phase 5 — Cities, Combat & Flow

Cities, population, combat resolution, and overall game loop with win conditions.

| Step | Title | Prompt File |
|------|-------|-------------|
| 5-1 | Cities, Population & Upgrades | [5-1-cities-population.md](./5-1-cities-population.md) |
| 5-2 | Combat System | [5-2-combat-system.md](./5-2-combat-system.md) |
| 5-3 | Game Loop & Win Conditions | [5-3-game-loop.md](./5-3-game-loop.md) |

## Phase 6 — UI, Mobile & Deployment

HUD, mobile controls, performance polish, and final Vercel deployment.

| Step | Title | Prompt File |
|------|-------|-------------|
| 6-1 | HUD, Tech Tree UI & Overlays | [6-1-hud-ui.md](./6-1-hud-ui.md) |
| 6-2 | Mobile Touch Controls | [6-2-mobile-controls.md](./6-2-mobile-controls.md) |
| 6-3 | Final Polish & Vercel Deployment | [6-3-vercel-deploy.md](./6-3-vercel-deploy.md) |

---

## AI enemy (LLM opponent)

| Doc | Description |
|-----|-------------|
| [ai.md](./ai.md) | AI turn flow, compact `BOARD` (rows×columns of cell blocks) + `STATE`, DeepSeek prompt/actions, provider matrix |

Serializer helpers live in `src/game/aiCompact.ts`. Splash collects provider + DeepSeek API key (other providers: “Not yet available”).

---

**How to use this tree**

1. Work through the phases in order.
2. For each step, open the linked `.md` file.
3. Use the **Prompt** section as the primary instruction for an AI coding agent or human developer.
4. Use the **Supplementary Information** for context, acceptance criteria, and mobile/Vercel-specific notes.

This structure is designed so that each step produces a clean, reviewable increment that can be committed and deployed to Vercel preview environments.

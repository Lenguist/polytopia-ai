# Polytopia AI

This repository explores artificial intelligence approaches for **The Battle of Polytopia** and contains a working **3D web implementation** of the core game built with React Three Fiber, three-bvh-csg, and Rapier, targeting mobile browsers and Vercel deployment.

## Live / Development

```bash
npm install
npm run dev
```

Then open the local URL (also works on phones on the same network thanks to `server.host: true`).

Deploy to Vercel by connecting this GitHub repository — `vercel.json` is already configured.

## Implementation Status

The 3D client follows the structured prompt tree in [`docs/spec/`](./docs/spec/).

| Phase | Status | Description |
|-------|--------|-------------|
| 1. Foundation | ✅ | Vite + R3F + Vercel + mobile performance baseline |
| 2. Core Game Logic | ✅ | Pure TS types, GameState, turns, stars, tech tree |
| 3. 3D World | ✅ | Instanced tile grid + three-bvh-csg features |
| 4. Units & Movement | ✅ | Unit rendering, Rapier, Chebyshev pathfinding |
| 5. Cities, Combat & Flow | ✅ | Cities, deterministic combat, win conditions |
| 6. UI, Mobile & Deploy | ✅ | HUD, tech panel, mobile-friendly controls, Vercel ready |

## What is The Battle of Polytopia?

*The Battle of Polytopia* is a highly polished, minimalist 4X turn-based strategy game by Midjiwan AB. Players lead asymmetric tribes across a procedurally generated square world, managing stars, technology, cities, and units in short, highly replayable sessions.

See the original detailed explanation in the commit history or the `docs/spec` tree for the full design notes that guided this implementation.

## Tech Stack

- **Vite** + **React 19** + **TypeScript**
- **@react-three/fiber** + **@react-three/drei**
- **@react-three/rapier** (physics)
- **three-bvh-csg** + **three-mesh-bvh** (terrain features)
- Deploy target: **Vercel**

## Project Structure

```
src/
  game/           # Pure TypeScript game engine (no Three.js)
  components/
    World/        # TileGrid, Cities, CSG features
    Units/        # Unit rendering + Rapier bodies
    UI/           # HUD, tech panel
  App.tsx         # Main scene + state orchestration
docs/spec/        # Implementation prompt tree
```

## License & Attribution

*The Battle of Polytopia* is a trademark of Midjiwan AB. This is an independent educational / research project and is not affiliated with or endorsed by Midjiwan.

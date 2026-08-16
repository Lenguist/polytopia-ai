# 3-2 Procedural Tile Grid with Instancing

## Prompt

Generate a square procedural tile grid from the pure GameState. Render tiles using `InstancedMesh` (or multiple instanced meshes by terrain type) for maximum performance. Support different terrain types (land, water, mountain, forest) with simple color or low-poly height differences. Keep the mapping between logical tile coordinates and 3D positions clear and documented.

## Supplementary Information

- Original game uses a square grid with Chebyshev distance.
- Prefer a single InstancedMesh per major terrain category to stay under mobile draw-call budgets.
- Include a simple fog-of-war representation (darker / hidden tiles).
- Acceptance: A 20×20 or larger map renders smoothly on mobile with correct terrain coloring.

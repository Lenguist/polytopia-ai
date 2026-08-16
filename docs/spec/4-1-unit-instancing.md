# 4-1 Unit Data Model & Instanced Rendering

## Prompt

Connect the pure Unit data from GameState to the 3D scene. Render units with InstancedMesh (or a small number of instanced meshes per unit type / tribe color). Support basic visual differentiation by tribe color and unit type (warrior, rider, etc.). Keep a clear bidirectional mapping between logical unit IDs and 3D instances.

## Supplementary Information

- Start with simple capsule or low-poly humanoid proxies; detailed models can come later.
- Tribe colors should be vivid and distinct.
- Units must be selectable (raycasting or pointer events).
- Acceptance: Multiple units of different tribes appear on the correct tiles and can be identified visually.

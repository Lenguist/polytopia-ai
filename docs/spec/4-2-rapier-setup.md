# 4-2 Rapier Physics Integration

## Prompt

Integrate `@react-three/rapier`. Wrap the world in a `<Physics>` component with a mobile-friendly timestep (e.g. 1/30). Add kinematic or dynamic rigid bodies for units and simple colliders for the ground / tiles. Demonstrate basic collision response. Keep physics optional for pure turn-based mode if desired.

## Supplementary Information

- Prefer `type="kinematicPosition"` for units that are moved by game logic.
- Use simple colliders (cuboid, capsule, hull).
- Sleeping bodies and low timestep are important for mobile battery life.
- Acceptance: Units have physical presence; a dropped dynamic object interacts correctly with the terrain.
